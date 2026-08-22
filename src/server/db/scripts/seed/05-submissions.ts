import { type AnswerInput, type Section } from '@/models/Question';
import {
  getOrCreateSubmission,
  getSubmissionSections,
  markSectionComplete,
  saveAnswers,
  submitSubmission,
} from '@/server/services/submission.service';
import { db } from '../..';
import { submissionsTable } from '../../schema/submissionsTable';
import { eq } from 'drizzle-orm';
import { type SeededOrg } from './03-users-and-companies';

function optionAt(section: Section, questionId: number, fraction: number) {
  const question = section.questions.find((q) => q.id === questionId);
  if (!question || question.options.length === 0) return null;

  const ordered = [...question.options].sort((a, b) => a.score - b.score);
  const index = Math.min(
    ordered.length - 1,
    Math.round(fraction * (ordered.length - 1))
  );
  return ordered[index];
}

function answersFor(sections: Section[], quality: number): AnswerInput[] {
  const answers: AnswerInput[] = [];

  for (const section of sections) {
    section.questions.forEach((question, index) => {
      const nudge = ((index % 3) - 1) * 0.2;
      const fraction = Math.min(1, Math.max(0, quality + nudge));

      if (question.type === 'text' || question.type === 'textarea') {
        answers.push({
          questionId: question.id,
          optionIds: [],
          value:
            question.type === 'textarea'
              ? 'We replaced our diesel forklift fleet with electric units and cut site fuel use by 38% year on year.'
              : 'Sam Rivera, Compliance Manager',
        });
        return;
      }

      if (question.type === 'checkbox') {
        const ordered = [...question.options].sort((a, b) => b.score - a.score);
        const take = Math.max(1, Math.round(fraction * ordered.length));
        answers.push({
          questionId: question.id,
          optionIds: ordered.slice(0, take).map((option) => option.id),
          value: '',
        });
        return;
      }

      const option = optionAt(section, question.id, fraction);
      if (option) {
        answers.push({
          questionId: question.id,
          optionIds: [option.id],
          value: '',
        });
      }
    });
  }

  return answers;
}

export async function seedSubmissions(org: SeededOrg) {
  const [northwind, solaris, fairfield] = org.supplierIds;

  console.log('  Northwind Components → in_progress');
  const first = await getOrCreateSubmission(northwind);
  if (!first.success || !first.data) {
    throw new Error(
      `Could not open a submission for supplier ${northwind}: ${first.message}`
    );
  }

  const sections = await getSubmissionSections(first.data.submissionId);
  if (sections.length === 0) {
    throw new Error('The seeded questionnaire has no sections.');
  }

  const firstSectionAnswers = answersFor([sections[0]], 0.75);
  const savedFirst = await saveAnswers(
    first.data.submissionId,
    firstSectionAnswers
  );
  if (!savedFirst.success) throw new Error(savedFirst.message);

  const marked = await markSectionComplete(
    first.data.submissionId,
    sections[0].id
  );
  if (!marked.success) throw new Error(marked.message);
  console.log(
    `    ${firstSectionAnswers.length} answers in "${sections[0].title}", section marked complete`
  );

  console.log('  Solaris Logistics → submitted');
  const second = await getOrCreateSubmission(solaris);
  if (!second.success || !second.data) {
    throw new Error(
      `Could not open a submission for supplier ${solaris}: ${second.message}`
    );
  }

  const allSections = await getSubmissionSections(second.data.submissionId);
  const allAnswers = answersFor(allSections, 0.6);
  const savedAll = await saveAnswers(second.data.submissionId, allAnswers);
  if (!savedAll.success) throw new Error(savedAll.message);

  const submitted = await submitSubmission(second.data.submissionId, {
    via: 'supplier',
  });
  if (!submitted.success) throw new Error(submitted.message);

  const { score, maxScore } = submitted;
  if (
    score === undefined ||
    maxScore === undefined ||
    maxScore <= 0 ||
    score < 0 ||
    score > maxScore
  ) {
    throw new Error(
      `Submitted submission has an implausible score: ${score}/${maxScore}`
    );
  }
  console.log(
    `    ${allAnswers.length} answers, submitted at ${score}/${maxScore} (${Math.round((score / maxScore) * 100)}%)`
  );

  console.log('  Fairfield Packaging → not_started');
  const third = await getOrCreateSubmission(fairfield);
  if (!third.success || !third.data) {
    throw new Error(
      `Could not open a submission for supplier ${fairfield}: ${third.message}`
    );
  }

  // Push the due date out so the cron's overdue and due-soon checks leave a fresh seed alone.
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 60);
  await db
    .update(submissionsTable)
    .set({ dueDate })
    .where(eq(submissionsTable.id, third.data.submissionId));
  console.log(`    due ${dueDate.toISOString().slice(0, 10)}, no answers`);

  return {
    inProgressSubmissionId: first.data.submissionId,
    submittedSubmissionId: second.data.submissionId,
    notStartedSubmissionId: third.data.submissionId,
    submittedScore: `${score}/${maxScore}`,
  };
}
