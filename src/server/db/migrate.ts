import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({
  path: '.env',
});

async function runMigration() {
  console.log('Migration started ⌛');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle({ client: pool });
  try {
    await migrate(db, { migrationsFolder: './src/server/db/migrations' });
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    await pool.end();
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Error in migration process:', error);
  process.exit(1);
});
