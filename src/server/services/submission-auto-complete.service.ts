'use server';

import { db } from '@/server/db';
import { answersTable } from '@/server/db/schema/answersTable';
import { companySupplierTable } from '@/server/db/schema/companySupplierTable';
import { emailLogTable } from '@/server/db/schema/emailLogTable';
import { questionOptionsTable } from '@/server/db/schema/questionOptionsTable';
import { questionsTable } from '@/server/db/schema/questionsTable';
import { submissionsTable } from '@/server/db/schema/submissionsTable';
import { createCompanyNotification } from '@/server/services/notification.service';
import {
  getOrCreateSubmission,
  submitSubmission,
} from '@/server/services/submission.service';
import { setToEndOfDay } from '@/lib/date';
import { EmailType } from '@/types/emailType';
import { NotificationType } from '@/types/notification-data';
import { isScoreable } from '@/types/questionnaire-data';
import { and, asc, eq, inArray, lt, lte } from 'drizzle-orm';

const REMINDER_WINDOW_DAYS = 14;

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function fillUnansweredWithLowestScore(
  submissionId: number,
  questionnaireId: number
): Promise<number> {
  const questions = await db
    .select({ id: questionsTable.id, type: questionsTable.type })
    .from(questionsTable)
    .where(eq(questionsTable.questionnaireId, questionnaireId));

  const options = await db
    .select({
      id: questionOptionsTable.id,
      questionId: questionOptionsTable.questionId,
      score: questionOptionsTable.score,
    })
    .from(questionOptionsTable)
    .innerJoin(
      questionsTable,
      eq(questionOptionsTable.questionId, questionsTable.id)
    )
    .where(eq(questionsTable.questionnaireId, questionnaireId))
    .orderBy(asc(questionOptionsTable.score));

  const answered = new Set(
    (
      await db
        .selectDistinct({ questionId: answersTable.questionId })
        .from(answersTable)
        .where(eq(answersTable.submissionId, submissionId))
    ).map((row) => row.questionId)
  );

  // Ordered by score ascending, so the first option seen per question is its lowest.
  const lowestByQuestion = new Map<number, number>();
  for (const option of options) {
    if (!lowestByQuestion.has(option.questionId)) {
      lowestByQuestion.set(option.questionId, option.id);
    }
  }

  const rows = questions
    .filter(
      (question) => isScoreable(question.type) && !answered.has(question.id)
    )
    .flatMap((question) => {
      const optionId = lowestByQuestion.get(question.id);
      return optionId === undefined
        ? []
        : [{ submissionId, questionId: question.id, optionId, value: null }];
    });

  if (rows.length === 0) return 0;

  await db.insert(answersTable).values(rows);
  return rows.length;
}

async function notifyCompanies(
  supplierIds: number[],
  type: NotificationType
): Promise<number> {
  if (supplierIds.length === 0) return 0;

  const links = await db
    .select({ companyId: companySupplierTable.companyId })
    .from(companySupplierTable)
    .where(inArray(companySupplierTable.supplierId, supplierIds));

  const counts = new Map<number, number>();
  for (const link of links) {
    counts.set(link.companyId, (counts.get(link.companyId) ?? 0) + 1);
  }

  for (const [companyId, supplierCount] of counts) {
    try {
      await createCompanyNotification({
        companyId,
        type,
        variables: { supplierCount },
      });
    } catch (error) {
      console.error(
        `[Cron] Notification failed for company ${companyId}:`,
        error
      );
    }
  }

  return counts.size;
}

export async function autoSubmitLapsedSubmissions() {
  try {
    const lapsed = await db
      .select({
        id: submissionsTable.id,
        supplierId: submissionsTable.supplierId,
        questionnaireId: submissionsTable.questionnaireId,
      })
      .from(submissionsTable)
      .where(
        and(
          inArray(submissionsTable.status, ['not_started', 'in_progress']),
          lt(submissionsTable.dueDate, new Date())
        )
      );

    if (lapsed.length === 0) {
      return { success: true, count: 0, message: 'No lapsed submissions.' };
    }

    console.log(`[Auto-Submit] ${lapsed.length} lapsed submission(s)`);

    const submitted: number[] = [];
    let filled = 0;

    for (const submission of lapsed) {
      try {
        filled += await fillUnansweredWithLowestScore(
          submission.id,
          submission.questionnaireId
        );

        const result = await submitSubmission(submission.id, { via: 'system' });
        if (result.success) {
          submitted.push(submission.supplierId);
          console.log(
            `[Auto-Submit] submission ${submission.id} → ${result.score}/${result.maxScore}`
          );
        } else {
          console.error(
            `[Auto-Submit] submission ${submission.id} failed: ${result.message}`
          );
        }
      } catch (error) {
        console.error(
          `[Auto-Submit] submission ${submission.id} threw:`,
          error
        );
      }
    }

    const companyCount = await notifyCompanies(
      submitted,
      NotificationType.submission_auto_submitted
    );

    return {
      success: true,
      count: submitted.length,
      companyCount,
      message: `Auto-submitted ${submitted.length} of ${lapsed.length} lapsed submissions (${filled} answers filled), notified ${companyCount} companies.`,
    };
  } catch (error) {
    console.error('[Auto-Submit] Job failed:', error);
    return {
      success: false,
      count: 0,
      message: 'Auto-submit failed.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function notifySuppliersWhoHaventStarted() {
  try {
    const rows = await db
      .selectDistinct({ supplierId: submissionsTable.supplierId })
      .from(submissionsTable)
      .innerJoin(
        emailLogTable,
        and(
          eq(emailLogTable.supplierId, submissionsTable.supplierId),
          eq(emailLogTable.emailType, EmailType.EVALUATION_INVITATION)
        )
      )
      .where(
        and(
          eq(submissionsTable.status, 'not_started'),
          lte(emailLogTable.createdAt, daysFromNow(-REMINDER_WINDOW_DAYS))
        )
      );

    const companyCount = await notifyCompanies(
      rows.map((row) => row.supplierId),
      NotificationType.submission_not_started
    );

    return {
      success: true,
      count: rows.length,
      companyCount,
      message: `${rows.length} supplier(s) still not started ${REMINDER_WINDOW_DAYS}+ days after invitation.`,
    };
  } catch (error) {
    console.error('[Not Started] Job failed:', error);
    return {
      success: false,
      count: 0,
      message: 'Not-started check failed.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function notifyDueDatesCloseToEnding() {
  try {
    const rows = await db
      .selectDistinct({ supplierId: submissionsTable.supplierId })
      .from(submissionsTable)
      .where(
        and(
          inArray(submissionsTable.status, ['not_started', 'in_progress']),
          lte(
            submissionsTable.dueDate,
            setToEndOfDay(daysFromNow(REMINDER_WINDOW_DAYS))
          )
        )
      );

    const companyCount = await notifyCompanies(
      rows.map((row) => row.supplierId),
      NotificationType.submission_reminder
    );

    return {
      success: true,
      count: rows.length,
      companyCount,
      message: `${rows.length} submission(s) due within ${REMINDER_WINDOW_DAYS} days.`,
    };
  } catch (error) {
    console.error('[Due Soon] Job failed:', error);
    return {
      success: false,
      count: 0,
      message: 'Due-date check failed.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function submitSubmissionForSupplier(supplierId: number) {
  try {
    const opened = await getOrCreateSubmission(supplierId);
    if (!opened.success || !opened.data) {
      return {
        success: false,
        message: opened.message ?? 'No submission found.',
      };
    }

    const { submissionId, questionnaireId } = opened.data;

    const filled = await fillUnansweredWithLowestScore(
      submissionId,
      questionnaireId
    );

    const result = await submitSubmission(submissionId, { via: 'admin' });
    if (!result.success) return result;

    return {
      ...result,
      message: `Submitted on the supplier's behalf (${filled} unanswered question${filled === 1 ? '' : 's'} scored 0).`,
    };
  } catch (error) {
    console.error(`[Manual Submit] Failed for supplier ${supplierId}:`, error);
    return {
      success: false,
      message: 'The questionnaire could not be submitted.',
    };
  }
}
