# LabCore deployment guide

This document describes how to deploy the LabCore MVP to production using **Vercel** (frontend) and **Supabase** (database). The NestJS API can be hosted on Vercel (serverless) or a separate host (e.g. Railway, Render).

---

## 1. Supabase (database)

1. **Create a project** at [supabase.com](https://supabase.com). Choose a region close to your users.

2. **Get connection strings** (Project Settings → Database):
   - **Connection string (URI)** – use "Transaction" mode for `DATABASE_URL` (with `?pgbouncer=true` if using Supabase Pooler).
   - **Direct connection** – use for `DIRECT_URL` (no pooler; required for Prisma migrations).

3. **Apply schema and migrations** from the repo root (with `DATABASE_URL` and `DIRECT_URL` set in `.env`):
   ```bash
   pnpm db:push
   ```
   Or, if using Prisma Migrate:
   ```bash
   pnpm db:migrate
   ```

4. **Optional: apply audit log immutability** (recommended for production):
   If you use migrations, the migration `20260223000000_audit_log_immutable_trigger` adds a PostgreSQL trigger so that rows in `audit_logs` cannot be updated or deleted. Ensure this migration is applied in production:
   ```bash
   pnpm db:migrate deploy
   ```
   If you use only `db:push`, run the SQL in `prisma/migrations/20260223000000_audit_log_immutable_trigger/migration.sql` manually in the Supabase SQL editor.

5. **Seed (optional)** for demo data:
   ```bash
   pnpm db:seed
   ```

6. **Backups**: On Supabase free tier, daily backups are available. For production, consider enabling Point-in-Time Recovery (Supabase Pro) if required.

---

## 2. Vercel (frontend – Next.js)

1. **Connect the repo** to Vercel (GitHub/GitLab/Bitbucket). Import the monorepo root.

2. **Configure the project**:
   - **Root directory**: leave as repository root.
   - **Framework preset**: Next.js.
   - **Build command**: `cd packages/web && pnpm install && pnpm run build` (or use a root script that builds only `web`).
   - **Output directory**: `packages/web/.next` (or leave default if Vercel detects Next.js in a subdirectory).
   - **Install command**: `pnpm install` (at root).

   If the repo root has a single `package.json` and the build is triggered from root, you can set:
   - Build: `pnpm run build --filter web` (or equivalent so only the web app is built).
   - Vercel will look for the Next.js app; point it to `packages/web` (set as root in Vercel project settings if needed).

3. **Environment variables** (Vercel project → Settings → Environment variables):
   - `NEXT_PUBLIC_API_URL` – full URL of your API (e.g. `https://api.yourdomain.com` or the URL of the API if deployed elsewhere). Required for the web app to call the API.

   The web app does not need `DATABASE_URL` or JWT secrets; those are used only by the API.

4. **Deploy**: Push to the connected branch or trigger a deploy from the Vercel dashboard.

---

## 3. API (NestJS)

The API must be reachable at the URL you set as `NEXT_PUBLIC_API_URL`. Options:

### Option A: Separate host (Railway, Render, Fly.io, etc.)

1. Deploy the NestJS app (e.g. build `packages/api`, run `node dist/main` or use the host’s Node/Runtime config).
2. Set environment variables on the host:
   - `DATABASE_URL`, `DIRECT_URL` (Supabase)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (and optionally `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`)
   - Optional: `NEXT_PUBLIC_API_URL` or `API_BASE_URL` for report share links
3. Point `NEXT_PUBLIC_API_URL` (in Vercel) to this API URL.

### Option B: Vercel serverless

NestJS can be run as serverless (e.g. with `@nestjs/platform-express` and a Vercel serverless entry). This requires a custom `api/index.ts` (or similar) that exports the NestJS app for Vercel’s serverless runtime. Not covered in full here; see Vercel + NestJS guides if you choose this route.

---

## 4. Environment variables summary

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | API (and local/migrate) | PostgreSQL connection (pooled if using Supabase Pooler) |
| `DIRECT_URL` | API (and local/migrate) | Direct PostgreSQL connection for migrations |
| `JWT_ACCESS_SECRET` | API | Signing access tokens (min 32 chars in production) |
| `JWT_REFRESH_SECRET` | API | Signing refresh tokens |
| `NEXT_PUBLIC_API_URL` | Web (Vercel) | Base URL of the API for browser requests |
| `NEXT_PUBLIC_API_URL` or `API_BASE_URL` | API (optional) | Base URL for report share links in emails/WhatsApp |

Copy from `.env.example` and set production values; never commit secrets.

---

## 5. Post-deploy checklist

- [ ] **Health**: `GET <API_URL>/health` returns 200.
- [ ] **Login**: Register or log in from the web app; confirm redirect to dashboard.
- [ ] **Full flow**: Create a patient → create an order → enter result → authorise → generate report → share via WhatsApp (or download PDF).
- [ ] **Audit**: If you applied the audit_log immutability migration, confirm that UPDATE/DELETE on `audit_logs` is rejected (e.g. in Supabase SQL editor).

---

## 6. Monorepo build on Vercel (reference)

If the Vercel project root is the repo root:

- **Build command**: `pnpm run build` (builds all packages) or `pnpm run --filter web build` to build only the web app.
- **Output directory**: Set to `packages/web/.next` if Vercel does not auto-detect the Next.js app in `packages/web`.
- **Install**: `pnpm install` (uses `pnpm-workspace.yaml` at root).

Ensure Node.js version is 20+ (set in Vercel project settings or `.nvmrc` / `engines` in `package.json`).
