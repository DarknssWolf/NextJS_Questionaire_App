'use server';

import { mapScoreToRisk, scorePercent } from '@/lib/scoring';
import {
  type AnswerInput,
  type AnswerState,
  type Section,
} from '@/models/Question';
import { db } from '@/server/db';
import { answersTable } from '@/server/db/schema/answersTable';
import { companySupplierTable } from '@/server/db/schema/companySupplierTable';
import { fileUploadTable } from '@/server/db/schema/fileUploadTable';
import { supplierDocumentStatusTable } from '@/server/db/schema/supplierDocumentStatusTable';
import { questionOptionsTable } from '@/server/db/schema/questionOptionsTable';
import { questionsTable } from '@/server/db/schema/questionsTable';
import { sectionsTable } from '@/server/db/schema/sectionsTable';
import { submissionsTable } from '@/server/db/schema/submissionsTable';
import { supplierAdditionalContactsTable } from '@/server/db/schema/supplierAdditionalContactsTable';
import { supplierTable } from '@/server/db/schema/supplierTable';
import {
  type FileRecord,
  type fileUploadCategory,
} from '@/server/services/file-storage.service';
import { createCompanyNotification } from '@/server/services/notification.service';
import { getActiveQuestionnaire } from '@/server/services/questionnaire-admin.service';
import { scoreSubmission } from '@/server/services/scoring.service';
import { calculateDueDate } from '@/lib/date';
import { NotificationType } from '@/types/notification-data';
import { type SubmissionStatus, isSubmitted } from '@/types/questionnaire-data';
import { type RiskLevel } from '@/types/risk';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';

export async function getOrCreateSubmission(supplierId: number): Promise<{
  success: boolean;
  message?: string;
  data?: {
    submissionId: number;
    questionnaireId: number;
    questionnaireName: string;
    status: SubmissionStatus;
    dueDate: Date | null;
  };
}> {
  try {
    if (!supplierId || supplierId <= 0) {
      return { success: false, message: 'Invalid supplier ID provided.' };
    }

    const questionnaire = await getActiveQuestionnaire();
    if (!questionnaire) {
      return {
        success: false,
        message:
          'There is no active questionnaire yet. An administrator needs to publish one before suppliers can respond.',
      };
    }

    const [open] = await db
      .select({
        id: submissionsTable.id,
        status: submissionsTable.status,
        dueDate: submissionsTable.dueDate,
      })
      .from(submissionsTable)
      .where(
        and(
          eq(submissionsTable.supplierId, supplierId),
          eq(submissionsTable.questionnaireId, questionnaire.id)
        )
      )
      .orderBy(desc(submissionsTable.id))
      .limit(1);

    if (open) {
      return {
        success: true,
        data: {
          submissionId: open.id,
          questionnaireId: questionnaire.id,
          questionnaireName: questionnaire.name,
          status: open.status,
          dueDate: open.dueDate,
        },
      };
    }

    const [created] = await db
      .insert(submissionsTable)
      .values({
        questionnaireId: questionnaire.id,
        supplierId,
        status: 'not_started',
        dueDate: calculateDueDate(),
      })
      .returning({
        id: submissionsTable.id,
        status: submissionsTable.status,
        dueDate: submissionsTable.dueDate,
      });

    return {
      success: true,
      data: {
        submissionId: created.id,
        questionnaireId: questionnaire.id,
        questionnaireName: questionnaire.name,
        status: created.status,
        dueDate: created.dueDate,
      },
    };
  } catch (error) {
    console.error('Error opening submission:', error);
    return { success: false, message: 'Could not open a questionnaire.' };
  }
}

export async function getSubmissionSections(
  submissionId: number
): Promise<Section[]> {
  try {
    const [submission] = await db
      .select({
        questionnaireId: submissionsTable.questionnaireId,
        supplierId: submissionsTable.supplierId,
      })
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId))
      .limit(1);

    if (!submission) return [];

    const sections = await db
      .select()
      .from(sectionsTable)
      .where(eq(sectionsTable.questionnaireId, submission.questionnaireId))
      .orderBy(asc(sectionsTable.sortOrder));

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.questionnaireId, submission.questionnaireId))
      .orderBy(asc(questionsTable.sortOrder));

    const options = await db
      .select({
        id: questionOptionsTable.id,
        questionId: questionOptionsTable.questionId,
        label: questionOptionsTable.label,
        score: questionOptionsTable.score,
      })
      .from(questionOptionsTable)
      .innerJoin(
        questionsTable,
        eq(questionOptionsTable.questionId, questionsTable.id)
      )
      .where(eq(questionsTable.questionnaireId, submission.questionnaireId))
      .orderBy(asc(questionOptionsTable.sortOrder));

    const contacts = await db
      .select({
        sectionId: supplierAdditionalContactsTable.sectionId,
        name: supplierAdditionalContactsTable.name,
        email: supplierAdditionalContactsTable.email,
      })
      .from(supplierAdditionalContactsTable)
      .where(
        eq(supplierAdditionalContactsTable.supplierId, submission.supplierId)
      );

    const optionsByQuestion = new Map<number, typeof options>();
    for (const option of options) {
      const bucket = optionsByQuestion.get(option.questionId) ?? [];
      bucket.push(option);
      optionsByQuestion.set(option.questionId, bucket);
    }

    const contactBySection = new Map(
      contacts
        .filter((contact) => contact.sectionId !== null)
        .map((contact) => [contact.sectionId!, contact])
    );

    return sections.map((section) => {
      const contact = contactBySection.get(section.id);

      return {
        id: section.id,
        title: section.title,
        description: section.description ?? undefined,
        contactName: contact?.name,
        contactEmail: contact?.email,
        questions: questions
          .filter((question) => question.sectionId === section.id)
          .map((question) => ({
            id: question.id,
            externalId: question.externalId,
            text: question.text,
            helpText: question.helpText ?? undefined,
            type: question.type,
            required: question.required,
            options: (optionsByQuestion.get(question.id) ?? []).map(
              ({ id, label, score }) => ({ id, label, score })
            ),
          })),
      };
    });
  } catch (error) {
    console.error('Error loading submission sections:', error);
    return [];
  }
}

export async function getSubmissionSectionOptions(
  submissionId: number
): Promise<{ id: number; title: string }[]> {
  try {
    return await db
      .select({ id: sectionsTable.id, title: sectionsTable.title })
      .from(sectionsTable)
      .innerJoin(
        submissionsTable,
        eq(submissionsTable.questionnaireId, sectionsTable.questionnaireId)
      )
      .where(eq(submissionsTable.id, submissionId))
      .orderBy(asc(sectionsTable.sortOrder));
  } catch (error) {
    console.error('Error loading section options:', error);
    return [];
  }
}

export interface SupplierSubmissionSummary {
  submissionId: number | null;
  status: SubmissionStatus;
  isSubmitted: boolean;
  wasAutoSubmitted: boolean;
  wasManuallySubmitted: boolean;
  progressPercent: number;
  score: number;
  maxScore: number;
  scorePercent: number;
  riskLevel: RiskLevel;
  dueDate: Date | null;
  submittedAt: Date | null;
}

const NO_SUBMISSION: SupplierSubmissionSummary = {
  submissionId: null,
  status: 'not_started',
  isSubmitted: false,
  wasAutoSubmitted: false,
  wasManuallySubmitted: false,
  progressPercent: 0,
  score: 0,
  maxScore: 0,
  scorePercent: 0,
  riskLevel: 'high',
  dueDate: null,
  submittedAt: null,
};

export async function getSupplierSubmissionSummary(
  supplierId: number
): Promise<SupplierSubmissionSummary> {
  try {
    const [submission] = await db
      .select({
        id: submissionsTable.id,
        questionnaireId: submissionsTable.questionnaireId,
        status: submissionsTable.status,
        score: submissionsTable.score,
        maxScore: submissionsTable.maxScore,
        dueDate: submissionsTable.dueDate,
        submittedAt: submissionsTable.submittedAt,
      })
      .from(submissionsTable)
      .where(eq(submissionsTable.supplierId, supplierId))
      .orderBy(desc(submissionsTable.submittedAt), desc(submissionsTable.id))
      .limit(1);

    if (!submission) return NO_SUBMISSION;

    const submitted = isSubmitted(submission.status);

    const { score, maxScore } =
      submitted && submission.score !== null && submission.maxScore !== null
        ? { score: submission.score, maxScore: submission.maxScore }
        : await scoreSubmission(submission.id);

    const [totals] = await db
      .select({ total: count() })
      .from(questionsTable)
      .where(eq(questionsTable.questionnaireId, submission.questionnaireId));

    const answered = await db
      .selectDistinct({ questionId: answersTable.questionId })
      .from(answersTable)
      .where(eq(answersTable.submissionId, submission.id));

    const totalQuestions = totals?.total ?? 0;
    const progressPercent = submitted
      ? 100
      : totalQuestions > 0
        ? Math.round((answered.length / totalQuestions) * 100)
        : 0;

    return {
      submissionId: submission.id,
      status: submission.status,
      isSubmitted: submitted,
      wasAutoSubmitted: submission.status === 'auto_submitted',
      wasManuallySubmitted: submission.status === 'manually_submitted',
      progressPercent,
      score,
      maxScore,
      scorePercent: scorePercent(score, maxScore),
      riskLevel: mapScoreToRisk(score, maxScore),
      dueDate: submission.dueDate,
      submittedAt: submission.submittedAt,
    };
  } catch (error) {
    console.error(
      `Error summarising submissions for supplier ${supplierId}:`,
      error
    );
    return NO_SUBMISSION;
  }
}

export async function createSubmissionForSupplier(
  supplierId: number,
  questionnaireId: number,
  dueDate?: Date
): Promise<{ id: number; dueDate: Date | null } | null> {
  try {
    const [existing] = await db
      .select({ id: submissionsTable.id, dueDate: submissionsTable.dueDate })
      .from(submissionsTable)
      .where(
        and(
          eq(submissionsTable.supplierId, supplierId),
          eq(submissionsTable.questionnaireId, questionnaireId)
        )
      )
      .orderBy(desc(submissionsTable.id))
      .limit(1);

    if (existing) return existing;

    const [created] = await db
      .insert(submissionsTable)
      .values({
        supplierId,
        questionnaireId,
        status: 'not_started',
        dueDate: dueDate ?? calculateDueDate(),
      })
      .returning({
        id: submissionsTable.id,
        dueDate: submissionsTable.dueDate,
      });

    return created ?? null;
  } catch (error) {
    console.error(
      `Error opening submission for supplier ${supplierId}:`,
      error
    );
    return null;
  }
}

export async function getLatestSubmissionForSupplier(
  supplierId: number
): Promise<{
  id: number;
  status: SubmissionStatus;
  dueDate: Date | null;
} | null> {
  try {
    const [submission] = await db
      .select({
        id: submissionsTable.id,
        status: submissionsTable.status,
        dueDate: submissionsTable.dueDate,
      })
      .from(submissionsTable)
      .where(eq(submissionsTable.supplierId, supplierId))
      .orderBy(desc(submissionsTable.id))
      .limit(1);

    return submission ?? null;
  } catch (error) {
    console.error('Error loading latest submission:', error);
    return null;
  }
}

export async function saveAnswers(
  submissionId: number,
  answers: AnswerInput[]
): Promise<{ success: boolean; message: string }> {
  try {
    if (submissionId <= 0) {
      return { success: false, message: 'Invalid submission.' };
    }

    const [submission] = await db
      .select({ status: submissionsTable.status })
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId))
      .limit(1);

    if (!submission) {
      return { success: false, message: 'Submission not found.' };
    }

    if (isSubmitted(submission.status)) {
      return {
        success: false,
        message:
          'This questionnaire has been submitted and can no longer be changed.',
      };
    }

    if (answers.length === 0) {
      return { success: true, message: 'Nothing to save.' };
    }

    await db.transaction(async (tx) => {
      await tx.delete(answersTable).where(
        and(
          eq(answersTable.submissionId, submissionId),
          inArray(
            answersTable.questionId,
            answers.map((answer) => answer.questionId)
          )
        )
      );

      const rows = answers.flatMap(
        (answer): (typeof answersTable.$inferInsert)[] => {
          if (answer.optionIds.length > 0) {
            return [...new Set(answer.optionIds)].map((optionId) => ({
              submissionId,
              questionId: answer.questionId,
              optionId,
              value: null,
            }));
          }

          const text = answer.value.trim();
          if (text === '') return [];

          return [
            {
              submissionId,
              questionId: answer.questionId,
              optionId: null,
              value: text,
            },
          ];
        }
      );

      if (rows.length > 0) {
        await tx.insert(answersTable).values(rows);
      }

      if (submission.status === 'not_started') {
        await tx
          .update(submissionsTable)
          .set({ status: 'in_progress' })
          .where(eq(submissionsTable.id, submissionId));
      }
    });

    return { success: true, message: 'Answers saved.' };
  } catch (error) {
    console.error('Error saving answers:', error);
    return { success: false, message: 'Answers could not be saved.' };
  }
}

export async function loadAnswers(submissionId: number): Promise<{
  success: boolean;
  data: AnswerState;
  message?: string;
}> {
  try {
    if (submissionId <= 0) {
      return { success: false, data: {}, message: 'Invalid submission.' };
    }

    const rows = await db
      .select({
        questionId: answersTable.questionId,
        optionId: answersTable.optionId,
        value: answersTable.value,
      })
      .from(answersTable)
      .where(eq(answersTable.submissionId, submissionId));

    const answers: AnswerState = {};
    for (const row of rows) {
      const entry = (answers[row.questionId] ??= { optionIds: [], value: '' });
      if (row.optionId !== null) entry.optionIds.push(row.optionId);
      if (row.value !== null) entry.value = row.value;
    }

    return { success: true, data: answers };
  } catch (error) {
    console.error('Error loading answers:', error);
    return {
      success: false,
      data: {},
      message: 'Answers could not be loaded.',
    };
  }
}

export async function getSubmissionProgress(submissionId: number): Promise<{
  success: boolean;
  data: {
    completedSectionIds: number[];
    isDocumentationComplete: boolean;
    status: SubmissionStatus;
    isSubmitted: boolean;
  };
}> {
  const empty = {
    completedSectionIds: [],
    isDocumentationComplete: false,
    status: 'not_started' as SubmissionStatus,
    isSubmitted: false,
  };

  try {
    const [submission] = await db
      .select({
        completedSectionIds: submissionsTable.completedSectionIds,
        isDocumentationComplete: submissionsTable.isDocumentationComplete,
        status: submissionsTable.status,
      })
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId))
      .limit(1);

    if (!submission) return { success: false, data: empty };

    return {
      success: true,
      data: {
        completedSectionIds: submission.completedSectionIds,
        isDocumentationComplete: submission.isDocumentationComplete,
        status: submission.status,
        isSubmitted: isSubmitted(submission.status),
      },
    };
  } catch (error) {
    console.error('Error loading submission progress:', error);
    return { success: false, data: empty };
  }
}

export async function markSectionComplete(
  submissionId: number,
  sectionId: number | 'documentation'
): Promise<{ success: boolean; message: string }> {
  try {
    if (sectionId === 'documentation') {
      await db
        .update(submissionsTable)
        .set({ isDocumentationComplete: true })
        .where(eq(submissionsTable.id, submissionId));

      return { success: true, message: 'Documentation marked as complete.' };
    }

    const [submission] = await db
      .select({ completedSectionIds: submissionsTable.completedSectionIds })
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId))
      .limit(1);

    if (!submission) {
      return { success: false, message: 'Submission not found.' };
    }

    const completed = [
      ...new Set([...submission.completedSectionIds, sectionId]),
    ];

    await db
      .update(submissionsTable)
      .set({ completedSectionIds: completed })
      .where(eq(submissionsTable.id, submissionId));

    return { success: true, message: 'Section marked as complete.' };
  } catch (error) {
    console.error('Error marking section complete:', error);
    return {
      success: false,
      message: 'The section could not be marked complete.',
    };
  }
}

export async function canSubmitSubmission(submissionId: number): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const [submission] = await db
      .select({
        questionnaireId: submissionsTable.questionnaireId,
        status: submissionsTable.status,
      })
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId))
      .limit(1);

    if (!submission) {
      return { success: false, message: 'Submission not found.' };
    }

    if (isSubmitted(submission.status)) {
      return {
        success: false,
        message: 'This questionnaire has already been submitted.',
      };
    }

    const required = await db
      .select({ id: questionsTable.id })
      .from(questionsTable)
      .where(
        and(
          eq(questionsTable.questionnaireId, submission.questionnaireId),
          eq(questionsTable.required, true)
        )
      );

    if (required.length === 0) {
      return { success: true, message: 'Ready to submit.' };
    }

    const answered = await db
      .selectDistinct({ questionId: answersTable.questionId })
      .from(answersTable)
      .where(
        and(
          eq(answersTable.submissionId, submissionId),
          inArray(
            answersTable.questionId,
            required.map((question) => question.id)
          )
        )
      );

    if (answered.length < required.length) {
      return {
        success: false,
        message: `Please answer every required question before submitting (${answered.length} of ${required.length} done).`,
      };
    }

    return { success: true, message: 'Ready to submit.' };
  } catch (error) {
    console.error('Error checking submission eligibility:', error);
    return {
      success: false,
      message: 'Could not check whether this can be submitted.',
    };
  }
}

export async function getSubmissionFiles(
  submissionId: number
): Promise<FileRecord[]> {
  try {
    const files = await db
      .select({
        id: fileUploadTable.id,
        fileName: fileUploadTable.fileName,
        originalFileName: fileUploadTable.originalFileName,
        fileSize: fileUploadTable.fileSize,
        mimeType: fileUploadTable.mimeType,
        storageKey: fileUploadTable.storageKey,
        status: fileUploadTable.status,
        fileUploadCategory: fileUploadTable.fileUploadCategory,
      })
      .from(fileUploadTable)
      .innerJoin(
        supplierDocumentStatusTable,
        eq(supplierDocumentStatusTable.fileUploadId, fileUploadTable.id)
      )
      .where(eq(supplierDocumentStatusTable.submissionId, submissionId));

    return files.map((file) => ({
      ...file,
      fileUploadCategory: file.fileUploadCategory as fileUploadCategory,
    }));
  } catch (error) {
    console.error('Error loading submission files:', error);
    return [];
  }
}

const STATUS_FOR: Record<'supplier' | 'admin' | 'system', SubmissionStatus> = {
  supplier: 'submitted',
  admin: 'manually_submitted',
  system: 'auto_submitted',
};

export async function submitSubmission(
  submissionId: number,
  { via }: { via: 'supplier' | 'admin' | 'system' }
): Promise<{
  success: boolean;
  message: string;
  score?: number;
  maxScore?: number;
}> {
  try {
    const [submission] = await db
      .select({
        supplierId: submissionsTable.supplierId,
        status: submissionsTable.status,
      })
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId))
      .limit(1);

    if (!submission) {
      return { success: false, message: 'Submission not found.' };
    }

    if (isSubmitted(submission.status)) {
      return {
        success: false,
        message: 'This questionnaire has already been submitted.',
      };
    }

    const [supplier] = await db
      .select({
        name: supplierTable.name,
        companyId: companySupplierTable.companyId,
      })
      .from(supplierTable)
      .innerJoin(
        companySupplierTable,
        eq(supplierTable.id, companySupplierTable.supplierId)
      )
      .where(eq(supplierTable.id, submission.supplierId))
      .limit(1);

    // Score before the status update so a scoring failure cannot leave a submitted submission unscored.
    const { score, maxScore } = await scoreSubmission(submissionId);

    const sectionIds = await db
      .select({ id: sectionsTable.id })
      .from(sectionsTable)
      .innerJoin(
        submissionsTable,
        eq(submissionsTable.questionnaireId, sectionsTable.questionnaireId)
      )
      .where(eq(submissionsTable.id, submissionId));

    await db
      .update(submissionsTable)
      .set({
        status: STATUS_FOR[via],
        submittedAt: new Date(),
        score,
        maxScore,
        completedSectionIds: sectionIds.map((section) => section.id),
      })
      .where(eq(submissionsTable.id, submissionId));

    if (supplier?.companyId) {
      await createCompanyNotification({
        companyId: supplier.companyId,
        type: NotificationType.submission_completed,
        variables: { supplierName: supplier.name },
      });
    }

    return {
      success: true,
      message: 'Questionnaire submitted.',
      score,
      maxScore,
    };
  } catch (error) {
    console.error('Error submitting questionnaire:', error);
    return {
      success: false,
      message: 'The questionnaire could not be submitted.',
    };
  }
}
