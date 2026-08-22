import 'dotenv/config';
import { count } from 'drizzle-orm';
import { db } from '..';
import { questionnairesTable } from '../schema/questionnairesTable';
import { usersTable } from '../schema/userTable';
import { seedLookups } from './seed/01-lookups';
import { seedDocumentRequirements } from './seed/02-document-requirements';
import { seedUsersAndCompanies } from './seed/03-users-and-companies';
import { SAMPLE_CSV_PATH, seedQuestionnaire } from './seed/04-questionnaire';
import { seedSubmissions } from './seed/05-submissions';

const FORCE = process.argv.includes('--force');

async function assertFreshDatabase() {
  const [{ total: userCount }] = await db
    .select({ total: count() })
    .from(usersTable);
  const [{ total: questionnaireCount }] = await db
    .select({ total: count() })
    .from(questionnairesTable);

  if (userCount === 0 && questionnaireCount === 0) return;

  if (FORCE) {
    console.warn(
      `--force: seeding on top of existing data (${userCount} users, ${questionnaireCount} questionnaires). Expect duplicates.`
    );
    return;
  }

  console.error('This database is already seeded.');
  console.error(
    `  Found ${userCount} user(s) and ${questionnaireCount} questionnaire(s).`
  );
  console.error('');
  console.error(
    '  To start over:  pnpm db:reset --yes && pnpm db:migrate && pnpm db:seed'
  );
  console.error('  To seed anyway: pnpm db:seed --force');
  process.exit(1);
}

async function step<T>(label: string, run: () => Promise<T>): Promise<T> {
  console.log(`\n${label}`);
  try {
    return await run();
  } catch (error) {
    console.error(`\n${label} failed.`);
    throw error;
  }
}

async function main() {
  console.log('Seeding database…');
  await assertFreshDatabase();

  const lookups = await step('01  Lookups', seedLookups);
  await step('02  Document requirements', seedDocumentRequirements);
  const org = await step('03  Company, suppliers and users', () =>
    seedUsersAndCompanies(lookups)
  );
  const questionnaire = await step('04  Questionnaire', () =>
    seedQuestionnaire(org)
  );
  const submissions = await step('05  Submissions', () => seedSubmissions(org));

  printSummary(org, questionnaire, submissions);
}

function printSummary(
  org: Awaited<ReturnType<typeof seedUsersAndCompanies>>,
  questionnaire: Awaited<ReturnType<typeof seedQuestionnaire>>,
  submissions: Awaited<ReturnType<typeof seedSubmissions>>
) {
  const rows = org.accounts.map((account) => [
    account.email,
    account.password,
    account.role,
    account.landsOn,
  ]);
  const headers = ['Email', 'Password', 'Role', 'Lands on'];
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => row[column].length))
  );
  const line = (cells: string[]) =>
    '  ' + cells.map((cell, i) => cell.padEnd(widths[i])).join('  ');

  console.log(
    '\n─────────────────────────────────────────────────────────────'
  );
  console.log('Seed complete.\n');
  console.log(line(headers));
  console.log('  ' + widths.map((w) => '─'.repeat(w)).join('  '));
  rows.forEach((row) => console.log(line(row)));

  console.log('');
  console.log(
    `  Questionnaire: version ${questionnaire.version}, ${questionnaire.sections.length} sections (${questionnaire.sections.map((s) => s.title).join(', ')})`
  );
  console.log(`  Imported from: ${SAMPLE_CSV_PATH}`);
  console.log(
    `  Submissions:   in progress #${submissions.inProgressSubmissionId} · submitted #${submissions.submittedSubmissionId} (${submissions.submittedScore}) · not started #${submissions.notStartedSubmissionId}`
  );
  console.log('');
  console.log(
    '  No file uploads are seeded — upload a document in the questionnaire to try that path.'
  );
  console.log('');
  console.log('TEMPLATE DEFAULTS — LOCAL DEV ONLY.');
  console.log(
    'These are well-known passwords; change them before any real deployment.'
  );
  console.log('─────────────────────────────────────────────────────────────');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
