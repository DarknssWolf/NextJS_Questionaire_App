import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '..';

const CONFIRMED = process.argv.includes('--yes');

function describeTarget(): string {
  const url = process.env.DATABASE_URL ?? '';
  const match = /@([^/]+)\/([^?]+)/.exec(url);
  return match ? `${match[2]} on ${match[1]}` : '(DATABASE_URL not set)';
}

async function main() {
  const target = describeTarget();

  if (!CONFIRMED) {
    console.error('This will DROP EVERYTHING in the public schema of:');
    console.error(`      ${target}`);
    console.error('');
    console.error(
      '    Every table, enum and row, plus drizzle migration history.'
    );
    console.error('');
    console.error('    Re-run with --yes if that is what you want:');
    console.error(
      '      pnpm db:reset --yes && pnpm db:migrate && pnpm db:seed'
    );
    process.exit(1);
  }

  console.log(`Dropping the public schema of ${target}…`);
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  await db.execute(sql`DROP SCHEMA public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);

  console.log('Done. The database is now empty.');
  console.log('');
  console.log('Next:  pnpm db:migrate && pnpm db:seed');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Reset failed:', error);
    process.exit(1);
  });
