# Supabase database: connect and seed

This guide explains how to point Prisma at your Supabase Postgres database and run migrations plus the demo seeder (`prisma/seed.ts`).

## Prerequisites

- A [Supabase](https://supabase.com) project with the database running (not paused).
- The **database password** for the `postgres` role (set when the project was created, or reset under **Project Settings → Database**). This is **not** your Supabase account login password.

## 1. Get connection strings

1. Open your project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Click **Connect** (or go to **Project Settings → Database**).
3. Under **Connection string**, choose **URI**.

You need **two** URLs for Prisma (see `prisma/schema.prisma`: `url` + `directUrl`).

| Variable | Use in dashboard | Typical shape |
|----------|------------------|---------------|
| **`DATABASE_URL`** | **Transaction** pooler (often port **6543**) | `postgresql://postgres.<project-ref>:PASSWORD@aws-....pooler.supabase.com:6543/postgres` |
| **`DIRECT_URL`** | **Session** pooler (port **5432** on the pooler host) | `postgresql://postgres.<project-ref>:PASSWORD@aws-....pooler.supabase.com:5432/postgres` |

Notes:

- **IPv4:** The **direct** host `db.<project-ref>.supabase.co:5432` often fails from home/office networks (`P1001: Can't reach database server`). Prefer the **session pooler** for `DIRECT_URL` when you are on IPv4.
- **Username:** The pooler usually expects `postgres.<project-ref>` (as shown in the dashboard), not plain `postgres`.
- **Password:** If it contains `@`, `#`, `%`, or other reserved characters, [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) them in the connection string.
- **SSL:** If you see authentication errors against the pooler, append **`?sslmode=require`** to `DIRECT_URL`, and for the transaction URL use **`?pgbouncer=true&sslmode=require`** (Prisma expects `pgbouncer=true` on the pooled `DATABASE_URL`).

## 2. Create `.env.supabase`

In the **repository root**, create a file named **`.env.supabase`** (this file is gitignored).

Example (replace placeholders with your values and dashboard strings):

```env
# Transaction pooler — Prisma client / pooled connections
DATABASE_URL="postgresql://postgres.<project-ref>:<PASSWORD>@aws-<n>-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Session pooler — migrations and operations that need a session (IPv4-friendly)
DIRECT_URL="postgresql://postgres.<project-ref>:<PASSWORD>@aws-<n>-<region>.pooler.supabase.com:5432/postgres?sslmode=require"
```

Copy hosts, ports, and usernames **exactly** from the Supabase **Connect** panel for each mode.

## 3. Run migrations and seed

From the repo root:

```bash
pnpm db:supabase:seed
```

This script:

1. Checks that `.env.supabase` exists.
2. Loads it (overriding `.env` for that run) and runs **`prisma migrate deploy`**.
3. Runs **`prisma db seed`** (demo lab, users, tests, etc.).

Local development can keep using **`.env`** with Docker Postgres; Supabase stays isolated in **`.env.supabase`**.

## 4. First-time schema on Supabase

If the database has **no** LabCore tables yet, sync the schema once, then use the seed command above:

```bash
npx dotenv-cli -e .env.supabase -o -- npx prisma db push
pnpm db:supabase:seed
```

(`db push` applies `schema.prisma` without relying on a full migration history; this repo’s tracked migrations may be incremental—see below.)

## 5. Troubleshooting

| Symptom | What to try |
|---------|-------------|
| **`P1001`** on `db.*.supabase.co` | Use **session pooler** for `DIRECT_URL` instead of the direct host. |
| **`P1000` Authentication failed** | Confirm **database** password; add **`sslmode=require`** to pooler URLs; URL-encode special characters in the password. |
| **`P3005` The database schema is not empty** | Schema may already match Prisma (e.g. after `db push`) while `_prisma_migrations` is out of sync. See [Prisma: Baseline a production database](https://www.prisma.io/docs/guides/migrate/production-troubleshooting#baseline-your-production-environment). For this repo’s single audit-trigger migration, if the DB already matches and you only need history aligned: `npx dotenv-cli -e .env.supabase -o -- npx prisma migrate resolve --applied "20260223000000_audit_log_immutable_trigger"`, then run `pnpm db:supabase:seed` again. |

## 6. Security

- Never commit **`.env.supabase`** (it is listed in `.gitignore`).
- Treat connection strings like secrets; rotate the database password if a string may have leaked.

## Related

- Example env layout: **`.env.example`**
- Prisma schema: **`prisma/schema.prisma`**
- Seed logic: **`prisma/seed.ts`**
