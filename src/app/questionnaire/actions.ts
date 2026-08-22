'use server';

import { type AnswerInput } from '@/models/Question';
import {
  canSubmitSubmission,
  getSubmissionProgress,
  getSubmissionSectionOptions,
  getSubmissionSections,
  loadAnswers,
  markSectionComplete,
  saveAnswers,
  submitSubmission,
} from '@/server/services/submission.service';

export async function getSubmissionSectionsAction(submissionId: number) {
  return await getSubmissionSections(submissionId);
}

export async function getSubmissionSectionOptionsAction(submissionId: number) {
  return await getSubmissionSectionOptions(submissionId);
}

export async function getSubmissionProgressAction(submissionId: number) {
  return await getSubmissionProgress(submissionId);
}

export async function markSectionCompleteAction(
  submissionId: number,
  sectionId: number | 'documentation'
) {
  return await markSectionComplete(submissionId, sectionId);
}

export async function canSubmitSubmissionAction(submissionId: number) {
  return await canSubmitSubmission(submissionId);
}

export async function submitSubmissionAction(submissionId: number) {
  return await submitSubmission(submissionId, { via: 'supplier' });
}

export async function saveAnswersAction(
  submissionId: number,
  answers: AnswerInput[]
) {
  return await saveAnswers(submissionId, answers);
}

export async function loadAnswersAction(submissionId: number) {
  return await loadAnswers(submissionId);
}
