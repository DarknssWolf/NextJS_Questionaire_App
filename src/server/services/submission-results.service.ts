'use server';

import {
  mapScoreToRisk,
  questionMaxScore,
  questionScore,
  scorePercent,
} from '@/lib/scoring';
import { db } from '@/server/db';
import { answersTable } from '@/server/db/schema/answersTable';
import { questionOptionsTable } from '@/server/db/schema/questionOptionsTable';
import { questionnairesTable } from '@/server/db/schema/questionnairesTable';
import { questionsTable } from '@/server/db/schema/questionsTable';
import { sectionsTable } from '@/server/db/schema/sectionsTable';
import { submissionsTable } from '@/server/db/schema/submissionsTable';
import { supplierTable } from '@/server/db/schema/supplierTable';
import { scoreSubmission } from '@/server/services/scoring.service';
import { type QuestionType, isSubmitted } from '@/types/questionnaire-data';
import { type RiskLevel } from '@/types/risk';
import { asc, eq } from 'drizzle-orm';

export interface SubmissionResultAnswer {
  questionId: number;
  externalId: string;
  text: string;
  type: QuestionType;
  given: string[];
  score: number;
  maxScore: number;
}

export interface SubmissionResultSection {
  id: number;
  title: string;
  description: string | null;
  score: number;
  maxScore: number;
  percent: number;
  riskLevel: RiskLevel;
  answers: SubmissionResultAnswer[];
}

export interface SubmissionResult {
  submissionId: number;
  supplierId: number;
  supplierName: string;
  questionnaireName: string;
  version: number;
  status: string;
  submittedAt: Date | null;
  dueDate: Date | null;
  score: number;
  maxScore: number;
  percent: number;
  riskLevel: RiskLevel;
  sections: SubmissionResultSection[];
}

export async function getSubmissionResult(
  submissionId: number
): Promise<SubmissionResult | null> {
  try {
    const [submission] = await db
      .select({
        id: submissionsTable.id,
        supplierId: submissionsTable.supplierId,
        supplierName: supplierTable.name,
        questionnaireId: submissionsTable.questionnaireId,
        questionnaireName: questionnairesTable.name,
        version: questionnairesTable.version,
        status: submissionsTable.status,
        submittedAt: submissionsTable.submittedAt,
        dueDate: submissionsTable.dueDate,
        storedScore: submissionsTable.score,
        storedMaxScore: submissionsTable.maxScore,
      })
      .from(submissionsTable)
      .innerJoin(
        supplierTable,
        eq(supplierTable.id, submissionsTable.supplierId)
      )
      .innerJoin(
        questionnairesTable,
        eq(questionnairesTable.id, submissionsTable.questionnaireId)
      )
      .where(eq(submissionsTable.id, submissionId))
      .limit(1);

    if (!submission) return null;

    const [sections, questions, options, answers, scored] = await Promise.all([
      db
        .select()
        .from(sectionsTable)
        .where(eq(sectionsTable.questionnaireId, submission.questionnaireId))
        .orderBy(asc(sectionsTable.sortOrder)),
      db
        .select()
        .from(questionsTable)
        .where(eq(questionsTable.questionnaireId, submission.questionnaireId))
        .orderBy(asc(questionsTable.sortOrder)),
      db
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
        .orderBy(asc(questionOptionsTable.sortOrder)),
      db
        .select({
          questionId: answersTable.questionId,
          optionId: answersTable.optionId,
          value: answersTable.value,
        })
        .from(answersTable)
        .where(eq(answersTable.submissionId, submissionId)),
      scoreSubmission(submissionId),
    ]);

    const optionById = new Map(options.map((option) => [option.id, option]));
    const optionsByQuestion = new Map<number, typeof options>();
    for (const option of options) {
      const bucket = optionsByQuestion.get(option.questionId) ?? [];
      bucket.push(option);
      optionsByQuestion.set(option.questionId, bucket);
    }

    const answersByQuestion = new Map<
      number,
      { labels: string[]; scores: number[]; text: string | null }
    >();
    for (const answer of answers) {
      const entry = answersByQuestion.get(answer.questionId) ?? {
        labels: [],
        scores: [],
        text: null,
      };

      if (answer.optionId !== null) {
        const option = optionById.get(answer.optionId);
        if (option) {
          entry.labels.push(option.label);
          entry.scores.push(option.score);
        }
      } else if (answer.value !== null) {
        entry.text = answer.value;
      }

      answersByQuestion.set(answer.questionId, entry);
    }

    const submitted = isSubmitted(submission.status);
    const score =
      submitted && submission.storedScore !== null
        ? submission.storedScore
        : scored.score;
    const maxScore =
      submitted && submission.storedMaxScore !== null
        ? submission.storedMaxScore
        : scored.maxScore;

    const sectionScoreById = new Map(
      scored.perSection.map((section) => [section.sectionId, section])
    );

    return {
      submissionId: submission.id,
      supplierId: submission.supplierId,
      supplierName: submission.supplierName,
      questionnaireName: submission.questionnaireName,
      version: submission.version,
      status: submission.status,
      submittedAt: submission.submittedAt,
      dueDate: submission.dueDate,
      score,
      maxScore,
      percent: scorePercent(score, maxScore),
      riskLevel: mapScoreToRisk(score, maxScore),
      sections: sections.map((section) => {
        const sectionScore = sectionScoreById.get(section.id) ?? {
          score: 0,
          maxScore: 0,
        };

        return {
          id: section.id,
          title: section.title,
          description: section.description,
          score: sectionScore.score,
          maxScore: sectionScore.maxScore,
          percent: scorePercent(sectionScore.score, sectionScore.maxScore),
          riskLevel: mapScoreToRisk(sectionScore.score, sectionScore.maxScore),
          answers: questions
            .filter((question) => question.sectionId === section.id)
            .map((question) => {
              const given = answersByQuestion.get(question.id);
              const optionScores = (
                optionsByQuestion.get(question.id) ?? []
              ).map((option) => option.score);

              const questionMax = questionMaxScore(question.type, optionScores);

              return {
                questionId: question.id,
                externalId: question.externalId,
                text: question.text,
                type: question.type,
                given: given
                  ? given.text !== null
                    ? [given.text]
                    : given.labels
                  : [],
                score: questionScore(
                  question.type,
                  given?.scores ?? [],
                  questionMax
                ),
                maxScore: questionMax,
              };
            }),
        };
      }),
    };
  } catch (error) {
    console.error(
      `Error building results for submission ${submissionId}:`,
      error
    );
    return null;
  }
}
