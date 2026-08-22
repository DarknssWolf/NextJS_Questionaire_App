'use server';

import {
  renameQuestionnaire,
  setQuestionnaireStatus,
  updateOptionLabel,
  updateQuestionText,
} from '@/server/services/questionnaire-admin.service';
import {
  importQuestionnaire,
  parseQuestionnaireCsv,
  summariseQuestionnaireRows,
  validateQuestionnaireRows,
} from '@/server/services/questionnaire-import.service';
import {
  type QuestionnaireStatus,
  type QuestionnaireTarget,
} from '@/types/questionnaire-data';
import { revalidatePath } from 'next/cache';

export async function parseQuestionnaireCsvAction(formData: FormData) {
  return await parseQuestionnaireCsv(formData);
}

export async function validateQuestionnaireRowsAction(
  rows: Record<string, string>[]
) {
  return await validateQuestionnaireRows(rows);
}

export async function summariseQuestionnaireRowsAction(
  rows: Record<string, string>[]
) {
  return await summariseQuestionnaireRows(rows);
}

export async function importQuestionnaireAction(
  rows: Record<string, string>[],
  target: QuestionnaireTarget
) {
  const result = await importQuestionnaire(rows, target);

  if (result.success) {
    revalidatePath('/admin/questionnaires');
  }

  return result;
}

export async function renameQuestionnaireAction(
  questionnaireId: number,
  name: string
) {
  const result = await renameQuestionnaire(questionnaireId, name);

  if (result.success) {
    revalidatePath(`/admin/questionnaires/${questionnaireId}`);
    revalidatePath('/admin/questionnaires');
  }

  return result;
}

export async function updateQuestionTextAction(
  questionnaireId: number,
  questionId: number,
  text: string,
  helpText?: string | null
) {
  const result = await updateQuestionText(questionId, text, helpText);

  if (result.success) {
    revalidatePath(`/admin/questionnaires/${questionnaireId}`);
  }

  return result;
}

export async function updateOptionLabelAction(
  questionnaireId: number,
  optionId: number,
  label: string
) {
  const result = await updateOptionLabel(optionId, label);

  if (result.success) {
    revalidatePath(`/admin/questionnaires/${questionnaireId}`);
  }

  return result;
}

export async function setQuestionnaireStatusAction(
  questionnaireId: number,
  status: QuestionnaireStatus
) {
  const result = await setQuestionnaireStatus(questionnaireId, status);

  if (result.success) {
    revalidatePath(`/admin/questionnaires/${questionnaireId}`);
    revalidatePath('/admin/questionnaires');
  }

  return result;
}
