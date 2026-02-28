# LabCore LIMS — Deployment Guide

**Version**: 1.0 · **Last Updated**: February 2026

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Database Setup (Supabase)](#3-database-setup-supabase)
4. [Deploying the Frontend (Vercel)](#4-deploying-the-frontend-vercel)
5. [Deploying the API (Railway / Render)](#5-deploying-the-api-railway--render)
6. [Connecting Frontend to API](#6-connecting-frontend-to-api)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [Post-Deploy Checklist](#8-post-deploy-checklist)
9. [Updating & Redeploying](#9-updating--redeploying)
10. [Rollback Procedures](#10-rollback-procedures)
11. [Git Workflow](#11-git-workflow)
12. [CORS Configuration](#12-cors-configuration)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

| Requirement       | Minimum Version / Details                                   |
|-------------------|-------------------------------------------------------------|
| Node.js           | 20+ (set via `.nvmrc` or `engines` in `package.json`)       |
| pnpm              | 9.x (`packageManager` field in `package.json`)              |
| Git               | Latest                                                      |
| GitHub account    | For repo hosting and CI/CD                                   |
| Vercel account    | Free tier at [vercel.com](https://vercel.com)                |
| Supabase project  | Free tier at [supabase.com](https://supabase.com)            |
| API host account  | Railway ([railway.app](https://railway.app)) or Render ([render.com](https://render.com)), free tier |

---

## 2. Local Development Setup

### 2.1 Install Dependencies

```bash
pnpm install
```

### 2.2 Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Set the following variables:
- `DATABASE_URL` and `DIRECT_URL` — PostgreSQL connection strings
- `NEXT_PUBLIC_API_URL` — e.g. `http://localhost:3001`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — at least 32 random characters each

### 2.3 Database (Option A: Supabase)

1. Create a Supabase project.
2. Copy the connection strings into `.env`.
3. Push the schema and seed:

```bash
pnpm db:push
pnpm db:seed
```

### 2.4 Database (Option B: Local Docker)

```bash
docker compose -f docker/docker-compose.yml up -d
```

This starts a PostgreSQL 16 instance with:
- User: `labcore`, Password: `labcore`, Database: `labcore`
- URL: `postgresql://labcore:labcore@localhost:5432/labcore`

Set both `DATABASE_URL` and `DIRECT_URL` to this URL in `.env`, then:

```bash
pnpm db:push
pnpm db:seed
```

### 2.5 Generate Prisma Client

```bash
pnpm db:generate
```

### 2.6 Start Development Servers

```bash
pnpm dev
```

This starts:
- **Web**: http://localhost:3000
- **API**: http://localhost:3001

**First-time login**: Mobile `9876543210`, Password `demo123`

---

## 3. Database Setup (Supabase)

### 3.1 Create a Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your users (e.g. Mumbai for India-based labs).

### 3.2 Get Connection Strings

In **Project Settings → Database**:
- **Connection string (URI)** — use "Transaction" mode for `DATABASE_URL` (append `?pgbouncer=true` if using Supabase Pooler).
- **Direct connection** — use for `DIRECT_URL` (required for Prisma migrations).

### 3.3 Apply Schema

**Option A — Schema push (simpler):**
```bash
pnpm db:push
```

**Option B — Migrations (recommended for production):**
```bash
pnpm db:migrate:deploy
```

### 3.4 Apply Audit Log Immutability (Recommended)

If using migrations, the migration `20260223000000_audit_log_immutable_trigger` adds a PostgreSQL trigger so that `audit_logs` rows cannot be updated or deleted.

```bash
pnpm db:migrate:deploy
```

If using only `db:push`, run the SQL in `prisma/migrations/20260223000000_audit_log_immutable_trigger/migration.sql` manually in the Supabase SQL editor.

### 3.5 Seed Demo Data (Optional)

```bash
pnpm db:seed
```

Creates a demo lab and user for initial login.

### 3.6 Backups

- **Free tier**: Daily automated backups.
- **Pro tier**: Point-in-Time Recovery (recommended for production).

---

## 4. Deploying the Frontend (Vercel)

### 4.1 Connect the Repository

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New → Project** and import the `labcore` repository.

### 4.2 Configure the Project

| Setting            | Value                                                            |
|--------------------|------------------------------------------------------------------|
| Root Directory     | `packages/web`                                                   |
| Framework Preset   | Next.js (auto-detected)                                          |
| Build & Output     | Leave default — `packages/web/vercel.json` handles monorepo      |

### 4.3 Environment Variables

Add in **Vercel → Project Settings → Environment Variables**:

| Variable              | Value                              |
|-----------------------|-------------------------------------|
| `NEXT_PUBLIC_API_URL` | Your production API URL (no trailing slash) |

The web app does **not** need `DATABASE_URL` or JWT secrets.

### 4.4 Deploy

Click **Deploy**. Your production URL will be like `labcore-xxx.vercel.app`. Every push to `main` triggers automatic production deploys.

---

## 5. Deploying the API (Railway / Render)

The NestJS API must be reachable at the URL set in `NEXT_PUBLIC_API_URL`.

### Option A: Railway

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → select `labcore`.
2. Configure:
   - **Root Directory**: `packages/api` (or build from repo root)
   - **Build Command**: `pnpm install && pnpm --filter api build`
   - **Start Command**: `node dist/main.js`
3. Add environment variables (see [§7](#7-environment-variables-reference)).
4. Deploy and copy the public URL.

### Option B: Render

1. Go to [render.com](https://render.com) → **New → Web Service** → connect the GitHub repo.
2. Configure:
   - **Root Directory**: `packages/api`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter api build`
   - **Start Command**: `node dist/main.js`
3. Add the same environment variables.
4. Deploy and copy the service URL.

### Option C: Vercel Serverless

NestJS can run as a serverless function on Vercel (requires custom `api/index.ts` entry point). See Vercel + NestJS guides for details.

---

## 6. Connecting Frontend to API

1. In **Vercel → Project Settings → Environment Variables**, set `NEXT_PUBLIC_API_URL` to the API URL from Step 5 (no trailing slash).
2. **Redeploy** the Vercel project (Deployments → … → Redeploy) for the new value to take effect.

---

## 7. Environment Variables Reference

| Variable              | Where        | Purpose                                         | Required |
|-----------------------|--------------|--------------------------------------------------|----------|
| `DATABASE_URL`        | API          | PostgreSQL connection (pooled)                   | Yes      |
| `DIRECT_URL`          | API/Migrate  | Direct PostgreSQL connection (for migrations)    | Yes      |
| `JWT_ACCESS_SECRET`   | API          | Signing access tokens (min 32 chars)             | Yes      |
| `JWT_REFRESH_SECRET`  | API          | Signing refresh tokens (min 32 chars)            | Yes      |
| `JWT_ACCESS_EXPIRY`   | API          | Access token expiry (default: 1h)                | No       |
| `JWT_REFRESH_EXPIRY`  | API          | Refresh token expiry (default: 7d)               | No       |
| `CORS_ORIGIN`         | API          | Allowed frontend origin(s) for CORS              | Yes      |
| `NEXT_PUBLIC_API_URL` | Web (Vercel) | Base URL of the API for browser requests         | Yes      |

> **Security**: Never commit secrets to version control. Use environment variables on your hosting platform.

---

## 8. Post-Deploy Checklist

- [ ] **Health check**: `GET <API_URL>/health` returns HTTP 200
- [ ] **Login**: Register or log in from the web app; confirm redirect to dashboard
- [ ] **Full flow**: Create a patient → create an order → enter result → authorise → generate report → share via WhatsApp (or download PDF)
- [ ] **Audit immutability**: If you applied the audit trigger migration, confirm that UPDATE/DELETE on `audit_logs` is rejected (test in Supabase SQL editor)
- [ ] **CORS**: Verify the web app can call the API without CORS errors in the browser console

---

## 9. Updating & Redeploying

### 9.1 Code Changes

1. Commit and push changes to `main`.
2. **Vercel** automatically redeploys the frontend.
3. **Railway/Render** automatically redeploys the API (if connected to the same repo/branch).

### 9.2 Schema Changes

1. Create a migration locally:
   ```bash
   pnpm db:migrate
   ```
2. Commit the migration files in `prisma/migrations/`.
3. Apply to production:
   ```bash
   DATABASE_URL="<prod-url>" DIRECT_URL="<prod-url>" pnpm db:migrate:deploy
   ```

---

## 10. Rollback Procedures

### 10.1 Frontend (Vercel)

1. Go to **Vercel → Deployments**.
2. Find the previous working deployment.
3. Click **… → Promote to Production** to instantly rollback.

### 10.2 API (Railway / Render)

- **Railway**: Rollback to a previous deployment from the deployment history.
- **Render**: Manually deploy a specific Git commit, or revert the commit and push.

### 10.3 Database

- **Supabase Free Tier**: Restore from the latest daily backup (via Supabase dashboard).
- **Supabase Pro**: Use Point-in-Time Recovery to restore to a specific timestamp.
- **Manual**: If you have a SQL dump, restore to a new Supabase project and point the API to it.

> **Caution**: Database rollbacks may result in data loss for records created after the backup point. Always verify the backup timestamp before restoring.

---

## 11. Git Workflow

| Branch     | Deploys To                                       |
|------------|--------------------------------------------------|
| `main`     | Production (Vercel + Railway/Render auto-deploy)  |
| Other      | Vercel preview URL; API remains on production     |

- Push or merge to `main` triggers production deployment for both frontend and API.
- Feature branches get Vercel preview URLs — useful for testing UI changes before merging.

---

## 12. CORS Configuration

Set `CORS_ORIGIN` on the API host to your Vercel production URL:

```
https://labcore-xxx.vercel.app
```

For multiple origins (e.g. production + preview), use a comma-separated list. Avoid `*` when using credentials (cookies/JWT).

---

## 13. Troubleshooting

| Problem                         | Solution                                                                              |
|---------------------------------|--------------------------------------------------------------------------------------|
| Vercel build fails (workspace)  | Ensure Root Directory is `packages/web` and `vercel.json` is present                  |
| API not reachable from web      | Check `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN` settings                                |
| DB errors in API                | Verify `DATABASE_URL` and `DIRECT_URL` point to Supabase; run `pnpm db:migrate:deploy`|
| Health check returns error      | Confirm API is running and database is accessible                                     |
| CORS errors in browser          | Set `CORS_ORIGIN` on the API to include your Vercel domain                            |
| Prisma generate fails           | Ensure `DATABASE_URL` and `DIRECT_URL` are set (use dummy values if no DB available)  |

---

## Available Scripts Reference

| Command               | Description                                   |
|-----------------------|-----------------------------------------------|
| `pnpm dev`            | Start web + API in development                |
| `pnpm dev:web`        | Start only the web frontend                   |
| `pnpm dev:api`        | Start only the API                            |
| `pnpm build`          | Build all packages                            |
| `pnpm db:generate`    | Generate Prisma client                        |
| `pnpm db:push`        | Push schema to DB (no migrations)             |
| `pnpm db:migrate`     | Create and run migrations (dev)               |
| `pnpm db:migrate:deploy` | Apply pending migrations (production)      |
| `pnpm db:seed`        | Seed demo lab and user                        |
| `pnpm db:studio`      | Open Prisma Studio (DB browser)               |

---

*For user workflows, see the [User Manual](user-manual.md).*
*For administrator configuration, see the [Admin Guide](admin-guide.md).*
