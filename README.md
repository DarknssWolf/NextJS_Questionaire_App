# Eye C You

A supplier questionnaire platform built with Next.js. Companies (clients) publish a questionnaire and invite their suppliers, who answer it; scores are surfaced in dashboards and a per-submission results page.

## Prerequisites

- Node.js 20+
- pnpm 10.12.3+
- Docker (for the local PostgreSQL database)

No external service accounts are needed: authentication is a local users table, files are stored in Postgres, and email is stubbed to the console.

## Running the app

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start the local database**

   ```bash
   docker compose up -d
   ```

   This runs PostgreSQL on `localhost:5433` with user/password `postgres`/`postgres` and database `questionnaire_app`.

3. **Set up environment variables** — create a `.env` file in the project root with:
   - `DATABASE_URL` - PostgreSQL connection string (matching the Docker database above)
   - `SESSION_SECRET` - Secret (min 32 chars) used to sign the session cookie JWT
   - `NEXT_PUBLIC_APP_URL` - Base URL used when building links (e.g. `http://localhost:3000`)

4. **Create the schema and fill it with sample data**

   ```bash
   pnpm db:migrate && pnpm db:seed
   ```

   This expects an empty database. If you already have one from an earlier run, reset first — the full cycle is always reproducible:

   ```bash
   pnpm db:reset --yes && pnpm db:migrate && pnpm db:seed
   ```

   The seed is run-once: a second `pnpm db:seed` aborts rather than duplicating data (`--force` overrides).

5. **Start the dev server**

   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) and sign in with any of the accounts below.

## Sample sign-in

`pnpm db:seed` creates one user per role and prints this table when it finishes:

| Email                | Role                        | Password       | Lands on                   |
| -------------------- | --------------------------- | -------------- | -------------------------- |
| `admin@local.dev`    | `super_admin`               | `Admin1234`    | `/admin/questionnaires`    |
| `client@local.dev`   | `client_admin`              | `User1234`     | `/dashboard`               |
| `client2@local.dev`  | `client_additional_admin`   | `User1234`     | `/dashboard`               |
| `supplier@local.dev` | `supplier_admin`            | `Supplier1234` | `/questionnaire`           |
| `contact@local.dev`  | `supplier_additional_admin` | `Supplier1234` | `/questionnaire/questions` |

These are template defaults for local development only. Users provisioned by the app also get well-known default passwords by role (see `DEFAULT_PASSWORDS` in `src/lib/auth/users.ts`) — replace with a real invitation flow before any real deployment.

## Sample data

The seed fills the database with everything needed to explore every flow:

- Lookups (countries, industries, spend categories, company sizes) and the required-document definitions.
- One client company, three suppliers, and a user for every role.
- A questionnaire imported from [`public/csv/sample-questionnaire.csv`](public/csv/sample-questionnaire.csv) — 3 sections, 21 questions, all five question types — pushed through the real upload code path.
- Submissions in three states, scored by the real scoring service: one in progress (the interactive supplier login, so it stays answerable), one submitted with a persisted score, one not started.

To upload your own questionnaire, sign in as the admin and go to `/admin/questionnaires/upload`; the sample CSV is the reference for the semicolon-delimited format.

## Useful scripts

```bash
pnpm dev                 # Dev server (pnpm dev:debug attaches the inspector)
pnpm build               # Production build
pnpm start               # Production server
pnpm typecheck           # TypeScript type checking
pnpm lint                # ESLint (lint:fix to auto-fix)
pnpm format              # Prettier
pnpm precommit           # typecheck + lint

pnpm db:generate         # Generate migration files
pnpm db:migrate          # Apply migrations
pnpm db:push             # Push schema directly (dev only)
pnpm db:studio           # Drizzle Studio (database GUI)
pnpm db:seed             # Fill a fresh database (run-once; --force to override)
pnpm db:reset --yes      # ⚠️ Drop and recreate the public schema

pnpm cron:auto-submit-surveys   # Run the auto-submit/reminder jobs once
```

## Technology stack

- **Framework**: [Next.js](https://nextjs.org) 16 (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5
- **UI**: [React](https://react.dev/) 19, [Tailwind CSS](https://tailwindcss.com/) 4, [Radix UI](https://www.radix-ui.com/) / [Shadcn UI](https://ui.shadcn.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: Local `users` table + JWT session cookie ([jose](https://github.com/panva/jose) / [bcryptjs](https://github.com/dcodeIO/bcrypt.js))
- **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Charts**: [Recharts](https://recharts.org/)
