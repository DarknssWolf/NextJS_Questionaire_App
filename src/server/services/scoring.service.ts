'use server';

import { questionMaxScore, questionScore } from '@/lib/scoring';
import { db } from '@/server/db';
import { answersTable } from '@/server/db/schema/answersTable';
import { questionOptionsTable } from '@/server/db/schema/questionOptionsTable';
import { questionsTable } from '@/server/db/schema/questionsTable';
import { sectionsTable } from '@/server/db/schema/sectionsTable';
import { submissionsTable } from '@/server/db/schema/submissionsTable';
import { asc, eq } from 'drizzle-orm';

export interface SectionScore {
  sectionId: number;
  title: string;
  sortOrder: number;
  score: number;
  maxScore: number;
}

export interface SubmissionScore {
  score: number;
  maxScore: number;
  perSection: SectionScore[];
}

const EMPTY_SCORE: SubmissionScore = { score: 0, maxScore: 0, perSection: [] };

export async function scoreSubmission(
  submissionId: number
): Promise<SubmissionScore> {
  try {
    const [submission] = await db
      .select({ questionnaireId: submissionsTable.questionnaireId })
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId))
      .limit(1);

    if (!submission) {
      console.error(`Cannot score submission ${submissionId}: not found`);
      return EMPTY_SCORE;
    }

    const sections = await db
      .select({
        id: sectionsTable.id,
        title: sectionsTable.title,
        sortOrder: sectionsTable.sortOrder,
      })
      .from(sectionsTable)
      .where(eq(sectionsTable.questionnaireId, submission.questionnaireId))
      .orderBy(asc(sectionsTable.sortOrder));

    const questions = await db
      .select({
        id: questionsTable.id,
        sectionId: questionsTable.sectionId,
        type: questionsTable.type,
      })
      .from(questionsTable)
      .where(eq(questionsTable.questionnaireId, submission.questionnaireId));

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
      .where(eq(questionsTable.questionnaireId, submission.questionnaireId));

    const answers = await db
      .select({
        questionId: answersTable.questionId,
        optionId: answersTable.optionId,
      })
      .from(answersTable)
      .where(eq(answersTable.submissionId, submissionId));

    const optionScoresByQuestion = new Map<number, number[]>();
    const optionScoreById = new Map<number, number>();
    for (const option of options) {
      const bucket = optionScoresByQuestion.get(option.questionId) ?? [];
      bucket.push(option.score);
      optionScoresByQuestion.set(option.questionId, bucket);
      optionScoreById.set(option.id, option.score);
    }

    const selectedScoresByQuestion = new Map<number, number[]>();
    for (const answer of answers) {
      if (answer.optionId === null) continue;
      const score = optionScoreById.get(answer.optionId);
      if (score === undefined) continue;
      const bucket = selectedScoresByQuestion.get(answer.questionId) ?? [];
      bucket.push(score);
      selectedScoresByQuestion.set(answer.questionId, bucket);
    }

    const totals = new Map<number, { score: number; maxScore: number }>(
      sections.map((section) => [section.id, { score: 0, maxScore: 0 }])
    );

    for (const question of questions) {
      const bucket = totals.get(question.sectionId);
      if (!bucket) continue;

      const maxScore = questionMaxScore(
        question.type,
        optionScoresByQuestion.get(question.id) ?? []
      );
      if (maxScore === 0) continue;

      bucket.maxScore += maxScore;
      bucket.score += questionScore(
        question.type,
        selectedScoresByQuestion.get(question.id) ?? [],
        maxScore
      );
    }

    const perSection: SectionScore[] = sections.map((section) => {
      const bucket = totals.get(section.id) ?? { score: 0, maxScore: 0 };
      return {
        sectionId: section.id,
        title: section.title,
        sortOrder: section.sortOrder,
        score: bucket.score,
        maxScore: bucket.maxScore,
      };
    });

    return {
      score: perSection.reduce((sum, section) => sum + section.score, 0),
      maxScore: perSection.reduce((sum, section) => sum + section.maxScore, 0),
      perSection,
    };
  } catch (error) {
    console.error(`Error scoring submission ${submissionId}:`, error);
    return EMPTY_SCORE;
  }
}

export async function questionnaireMaxScore(
  questionnaireId: number
): Promise<number> {
  try {
    const questions = await db
      .select({ id: questionsTable.id, type: questionsTable.type })
      .from(questionsTable)
      .where(eq(questionsTable.questionnaireId, questionnaireId));

    const options = await db
      .select({
        questionId: questionOptionsTable.questionId,
        score: questionOptionsTable.score,
      })
      .from(questionOptionsTable)
      .innerJoin(
        questionsTable,
        eq(questionOptionsTable.questionId, questionsTable.id)
      )
      .where(eq(questionsTable.questionnaireId, questionnaireId));

    const scoresByQuestion = new Map<number, number[]>();
    for (const option of options) {
      const bucket = scoresByQuestion.get(option.questionId) ?? [];
      bucket.push(option.score);
      scoresByQuestion.set(option.questionId, bucket);
    }

    return questions.reduce(
      (total, question) =>
        total +
        questionMaxScore(
          question.type,
          scoresByQuestion.get(question.id) ?? []
        ),
      0
    );
  } catch (error) {
    console.error(
      `Error computing max score for questionnaire ${questionnaireId}:`,
      error
    );
    return 0;
  }
}
