'use server';

import { db } from '@/server/db';
import { questionOptionsTable } from '@/server/db/schema/questionOptionsTable';
import { questionnairesTable } from '@/server/db/schema/questionnairesTable';
import { questionsTable } from '@/server/db/schema/questionsTable';
import { sectionsTable } from '@/server/db/schema/sectionsTable';
import {
  type ParsedQuestion,
  type QuestionnaireStatus,
  type QuestionnaireStructure,
  type QuestionnaireSummary,
  type QuestionnaireTarget,
  type QuestionnaireValidationError,
  isScoreable,
} from '@/types/questionnaire-data';
import { asc, count, desc, eq, max, ne } from 'drizzle-orm';

const MIN_CHOICE_OPTIONS = 2;

export async function getActiveQuestionnaire(): Promise<{
  id: number;
  key: string;
  name: string;
  description: string | null;
  version: number;
} | null> {
  try {
    const rows = await db
      .select({
        id: questionnairesTable.id,
        key: questionnairesTable.key,
        name: questionnairesTable.name,
        description: questionnairesTable.description,
        version: questionnairesTable.version,
      })
      .from(questionnairesTable)
      .where(eq(questionnairesTable.status, 'active'))
      .orderBy(desc(questionnairesTable.version))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    console.error('Error fetching active questionnaire:', error);
    return null;
  }
}

export async function listQuestionnaires(): Promise<QuestionnaireSummary[]> {
  try {
    // Distinct alias names — two subquery columns both called `total` are ambiguous to Postgres.
    const sectionCounts = db
      .select({
        questionnaireId: sectionsTable.questionnaireId,
        total: count().as('section_total'),
      })
      .from(sectionsTable)
      .groupBy(sectionsTable.questionnaireId)
      .as('section_counts');

    const questionCounts = db
      .select({
        questionnaireId: questionsTable.questionnaireId,
        total: count().as('question_total'),
      })
      .from(questionsTable)
      .groupBy(questionsTable.questionnaireId)
      .as('question_counts');

    const rows = await db
      .select({
        id: questionnairesTable.id,
        key: questionnairesTable.key,
        name: questionnairesTable.name,
        description: questionnairesTable.description,
        version: questionnairesTable.version,
        status: questionnairesTable.status,
        createdAt: questionnairesTable.createdAt,
        sectionCount: sectionCounts.total,
        questionCount: questionCounts.total,
      })
      .from(questionnairesTable)
      .leftJoin(
        sectionCounts,
        eq(sectionCounts.questionnaireId, questionnairesTable.id)
      )
      .leftJoin(
        questionCounts,
        eq(questionCounts.questionnaireId, questionnairesTable.id)
      )
      .orderBy(asc(questionnairesTable.key), desc(questionnairesTable.version));

    return rows.map((row) => ({
      ...row,
      sectionCount: row.sectionCount ?? 0,
      questionCount: row.questionCount ?? 0,
    }));
  } catch (error) {
    console.error('Error listing questionnaires:', error);
    return [];
  }
}

export async function getQuestionnaireStructure(
  questionnaireId: number
): Promise<QuestionnaireStructure | null> {
  try {
    const [questionnaire] = await db
      .select()
      .from(questionnairesTable)
      .where(eq(questionnairesTable.id, questionnaireId))
      .limit(1);

    if (!questionnaire) return null;

    const sections = await db
      .select()
      .from(sectionsTable)
      .where(eq(sectionsTable.questionnaireId, questionnaireId))
      .orderBy(asc(sectionsTable.sortOrder));

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.questionnaireId, questionnaireId))
      .orderBy(asc(questionsTable.sortOrder));

    const options = await db
      .select({
        id: questionOptionsTable.id,
        questionId: questionOptionsTable.questionId,
        label: questionOptionsTable.label,
        score: questionOptionsTable.score,
        sortOrder: questionOptionsTable.sortOrder,
      })
      .from(questionOptionsTable)
      .innerJoin(
        questionsTable,
        eq(questionOptionsTable.questionId, questionsTable.id)
      )
      .where(eq(questionsTable.questionnaireId, questionnaireId))
      .orderBy(asc(questionOptionsTable.sortOrder));

    const optionsByQuestion = new Map<number, typeof options>();
    for (const option of options) {
      const bucket = optionsByQuestion.get(option.questionId) ?? [];
      bucket.push(option);
      optionsByQuestion.set(option.questionId, bucket);
    }

    return {
      id: questionnaire.id,
      key: questionnaire.key,
      name: questionnaire.name,
      description: questionnaire.description,
      version: questionnaire.version,
      status: questionnaire.status,
      sections: sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        sortOrder: section.sortOrder,
        questions: questions
          .filter((question) => question.sectionId === section.id)
          .map((question) => ({
            id: question.id,
            externalId: question.externalId,
            text: question.text,
            helpText: question.helpText,
            type: question.type,
            required: question.required,
            sortOrder: question.sortOrder,
            options: (optionsByQuestion.get(question.id) ?? []).map(
              ({ id, label, score, sortOrder }) => ({
                id,
                label,
                score,
                sortOrder,
              })
            ),
          })),
      })),
    };
  } catch (error) {
    console.error('Error fetching questionnaire structure:', error);
    return null;
  }
}

export async function validateQuestionnaireStructure(
  questions: ParsedQuestion[]
): Promise<QuestionnaireValidationError[]> {
  const errors: QuestionnaireValidationError[] = [];

  if (questions.length === 0) {
    errors.push({
      row: 0,
      field: 'file',
      message: 'The questionnaire has no questions.',
    });
    return errors;
  }

  const sectionTitles = new Set(questions.map((q) => q.sectionTitle));
  if (sectionTitles.size === 0) {
    errors.push({
      row: 0,
      field: 'Section',
      message: 'The questionnaire has no sections.',
    });
  }

  const seenExternalIds = new Set<string>();

  questions.forEach((question, index) => {
    const row = index + 1;

    if (seenExternalIds.has(question.externalId)) {
      errors.push({
        row,
        field: 'Question ID',
        message: `Question ID "${question.externalId}" is used more than once.`,
      });
    }
    seenExternalIds.add(question.externalId);

    if (question.sectionTitle.trim() === '') {
      errors.push({
        row,
        field: 'Section',
        message: `Question "${question.externalId}" has no section.`,
      });
    }

    if (question.text.trim() === '') {
      errors.push({
        row,
        field: 'Question',
        message: `Question "${question.externalId}" has no text.`,
      });
    }

    if (isScoreable(question.type)) {
      if (question.options.length < MIN_CHOICE_OPTIONS) {
        errors.push({
          row,
          field: 'Option',
          message: `Question "${question.externalId}" is a ${question.type} question and needs at least ${MIN_CHOICE_OPTIONS} options (found ${question.options.length}).`,
        });
      }
    } else if (question.options.length > 0) {
      errors.push({
        row,
        field: 'Option',
        message: `Question "${question.externalId}" is a ${question.type} question and cannot have options.`,
      });
    }
  });

  return errors;
}

export async function createQuestionnaireVersion(
  target: QuestionnaireTarget,
  questions: ParsedQuestion[]
): Promise<{
  success: boolean;
  message: string;
  questionnaireId?: number;
  version?: number;
  errors?: QuestionnaireValidationError[];
}> {
  const errors = await validateQuestionnaireStructure(questions);
  if (errors.length > 0) {
    return {
      success: false,
      message: `The questionnaire could not be published: ${errors.length} structural ${errors.length === 1 ? 'problem' : 'problems'} found.`,
      errors,
    };
  }

  try {
    const result = await db.transaction(async (tx) => {
      let key: string;
      let name: string;
      let description: string | null;
      let version: number;

      if (target.kind === 'new') {
        name = target.name.trim();
        if (name === '') {
          throw new Error('A questionnaire name is required.');
        }
        description = target.description?.trim() ?? null;
        key = await nextAvailableKey(tx, slugify(name));
        version = 1;
      } else {
        const [existing] = await tx
          .select({
            key: questionnairesTable.key,
            name: questionnairesTable.name,
            description: questionnairesTable.description,
          })
          .from(questionnairesTable)
          .where(eq(questionnairesTable.id, target.questionnaireId))
          .limit(1);

        if (!existing) {
          throw new Error(
            `Questionnaire ${target.questionnaireId} does not exist.`
          );
        }

        key = existing.key;
        name = existing.name;
        description = existing.description;

        const [{ highest }] = await tx
          .select({ highest: max(questionnairesTable.version) })
          .from(questionnairesTable)
          .where(eq(questionnairesTable.key, key));

        version = (highest ?? 0) + 1;
      }

      const [questionnaire] = await tx
        .insert(questionnairesTable)
        .values({ key, name, description, version, status: 'active' })
        .returning({ id: questionnairesTable.id });

      await tx
        .update(questionnairesTable)
        .set({ status: 'archived' })
        .where(ne(questionnairesTable.id, questionnaire.id));

      const sectionOrder: string[] = [];
      for (const question of questions) {
        if (!sectionOrder.includes(question.sectionTitle)) {
          sectionOrder.push(question.sectionTitle);
        }
      }

      const insertedSections = await tx
        .insert(sectionsTable)
        .values(
          sectionOrder.map((title, index) => ({
            questionnaireId: questionnaire.id,
            title,
            sortOrder: index + 1,
          }))
        )
        .returning({ id: sectionsTable.id, title: sectionsTable.title });

      const sectionIdByTitle = new Map(
        insertedSections.map((section) => [section.title, section.id])
      );

      const insertedQuestions = await tx
        .insert(questionsTable)
        .values(
          questions.map((question, index) => ({
            questionnaireId: questionnaire.id,
            sectionId: sectionIdByTitle.get(question.sectionTitle)!,
            externalId: question.externalId,
            text: question.text,
            helpText: question.helpText ?? null,
            type: question.type,
            required: question.required,
            sortOrder: index + 1,
          }))
        )
        .returning({
          id: questionsTable.id,
          externalId: questionsTable.externalId,
        });

      const questionIdByExternalId = new Map(
        insertedQuestions.map((question) => [question.externalId, question.id])
      );

      const optionRows = questions.flatMap((question) =>
        question.options.map((option, index) => ({
          questionId: questionIdByExternalId.get(question.externalId)!,
          label: option.label,
          score: option.score,
          sortOrder: index + 1,
        }))
      );

      if (optionRows.length > 0) {
        await tx.insert(questionOptionsTable).values(optionRows);
      }

      return {
        questionnaireId: questionnaire.id,
        version,
        name,
        sectionCount: insertedSections.length,
        questionCount: insertedQuestions.length,
        optionCount: optionRows.length,
      };
    });

    return {
      success: true,
      message: `Published "${result.name}" version ${result.version}: ${result.sectionCount} sections, ${result.questionCount} questions, ${result.optionCount} options. It is now the active questionnaire.`,
      questionnaireId: result.questionnaireId,
      version: result.version,
    };
  } catch (error) {
    console.error('Error creating questionnaire version:', error);
    return {
      success: false,
      message: `The questionnaire could not be published: ${error instanceof Error ? error.message : 'unknown error'}. Nothing was imported.`,
    };
  }
}

export async function renameQuestionnaire(
  questionnaireId: number,
  name: string
): Promise<{ success: boolean; message: string }> {
  const trimmed = name.trim();
  if (trimmed === '') {
    return { success: false, message: 'A questionnaire name is required.' };
  }

  try {
    const [questionnaire] = await db
      .select({ key: questionnairesTable.key })
      .from(questionnairesTable)
      .where(eq(questionnairesTable.id, questionnaireId))
      .limit(1);

    if (!questionnaire) {
      return { success: false, message: 'Questionnaire not found.' };
    }

    await db
      .update(questionnairesTable)
      .set({ name: trimmed })
      .where(eq(questionnairesTable.key, questionnaire.key));

    return { success: true, message: 'Questionnaire renamed.' };
  } catch (error) {
    console.error('Error renaming questionnaire:', error);
    return {
      success: false,
      message: 'The questionnaire could not be renamed.',
    };
  }
}

export async function updateQuestionText(
  questionId: number,
  text: string,
  helpText?: string | null
): Promise<{ success: boolean; message: string }> {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { success: false, message: 'Question text cannot be empty.' };
  }

  try {
    const updated = await db
      .update(questionsTable)
      .set({
        text: trimmed,
        helpText: helpText?.trim() ? helpText.trim() : null,
      })
      .where(eq(questionsTable.id, questionId))
      .returning({ id: questionsTable.id });

    if (updated.length === 0) {
      return { success: false, message: 'Question not found.' };
    }

    return { success: true, message: 'Question updated.' };
  } catch (error) {
    console.error('Error updating question text:', error);
    return { success: false, message: 'The question could not be updated.' };
  }
}

export async function updateOptionLabel(
  optionId: number,
  label: string
): Promise<{ success: boolean; message: string }> {
  const trimmed = label.trim();
  if (trimmed === '') {
    return { success: false, message: 'Option text cannot be empty.' };
  }

  try {
    const updated = await db
      .update(questionOptionsTable)
      .set({ label: trimmed })
      .where(eq(questionOptionsTable.id, optionId))
      .returning({ id: questionOptionsTable.id });

    if (updated.length === 0) {
      return { success: false, message: 'Option not found.' };
    }

    return { success: true, message: 'Option updated.' };
  } catch (error) {
    console.error('Error updating option label:', error);
    return { success: false, message: 'The option could not be updated.' };
  }
}

export async function setQuestionnaireStatus(
  questionnaireId: number,
  status: QuestionnaireStatus
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await db.transaction(async (tx) => {
      const updated = await tx
        .update(questionnairesTable)
        .set({ status })
        .where(eq(questionnairesTable.id, questionnaireId))
        .returning({ id: questionnairesTable.id });

      if (updated.length === 0) {
        throw new Error('Questionnaire not found.');
      }

      if (status === 'active') {
        await tx
          .update(questionnairesTable)
          .set({ status: 'archived' })
          .where(ne(questionnairesTable.id, questionnaireId));
      }

      return updated[0].id;
    });

    return {
      success: true,
      message:
        status === 'active'
          ? `Questionnaire ${result} is now the active questionnaire.`
          : `Questionnaire ${result} archived.`,
    };
  } catch (error) {
    console.error('Error setting questionnaire status:', error);
    return {
      success: false,
      message: `The status could not be changed: ${error instanceof Error ? error.message : 'unknown error'}.`,
    };
  }
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug === '' ? 'questionnaire' : slug;
}

async function nextAvailableKey(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  base: string
): Promise<string> {
  const taken = await tx
    .select({ key: questionnairesTable.key })
    .from(questionnairesTable);

  const keys = new Set(taken.map((row) => row.key));
  if (!keys.has(base)) return base;

  let suffix = 2;
  while (keys.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
