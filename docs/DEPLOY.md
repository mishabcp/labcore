# LabCore deployment guide (Vercel + Git + API host)

Follow these steps to deploy the frontend to Vercel and the API to Railway or Render. Git is used for automatic deployments.

## Prerequisites

- GitHub account
- Vercel account (free at [vercel.com](https://vercel.com))
- Railway or Render account (free tier)
- Supabase project for PostgreSQL

---

## Step 1: Git and first push

The repo is already initialized and `.gitignore` is set (including un-ignoring `pnpm-lock.yaml` for reliable installs).

1. Create a new repository on GitHub named `labcore` (do not add README/license if the repo already has content).
2. Add the remote and push:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/labcore.git
   git add .
   git commit -m "Initial commit: LabCore monorepo"
   git branch -M main
   git push -u origin main
   ```

   Use only the message above—do not add a `Co-authored-by` trailer. (To stop Cursor from adding one automatically, turn off **Cursor Settings → Agent → Attribution**.)

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2: Deploy the Next.js app on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New…** → **Project** and import the `labcore` repository.
3. Configure the project:
   - **Root Directory:** Click **Edit**, select `packages/web`, confirm.
   - **Framework Preset:** Next.js (auto-detected).
   - **Build and Output:** Leave default; `packages/web/vercel.json` sets install and build for the monorepo.
4. **Environment variables:** In Project Settings → Environment Variables, add:
   - `NEXT_PUBLIC_API_URL` = your production API URL (from Step 3). You can add a placeholder (e.g. `https://your-app.up.railway.app`) and update it after the API is deployed.
   - Any other `NEXT_PUBLIC_*` from `.env.example` if the web app needs them (e.g. Supabase anon key for client features).
5. Click **Deploy**. Your production URL will be like `labcore-xxx.vercel.app`. Every push to `main` deploys production; other branches get preview URLs.

---

## Step 3: Deploy the NestJS API (Railway or Render)

The API must be hosted separately so the frontend can call it. Use one of the options below.

### Option A: Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select `labcore`.
3. Configure the service:
   - **Root Directory:** `packages/api` (or leave empty and use custom build/start).
   - **Build Command:** From repo root: `pnpm install && pnpm --filter api build`. Or with Root Directory `packages/api`: set build to run from repo root (Railway may allow "Root" = repo root, then **Build** = `pnpm --filter api build`).
   - **Start Command:** With Root Directory `packages/api`, use `node dist/main.js`. Ensure **Start** runs from `packages/api` (where `dist/` is after build).
4. **Variables:** Add all from `.env.example` that the API needs:
   - `DATABASE_URL`, `DIRECT_URL` (Supabase connection strings)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
   - `CORS_ORIGIN` = your Vercel app URL (e.g. `https://labcore-xxx.vercel.app`)
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (and any other Supabase/env vars the API uses)
5. Deploy and copy the public URL (e.g. `https://labcore-api-production-xxx.up.railway.app`).

### Option B: Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect the `labcore` GitHub repo.
3. **Root Directory:** `packages/api`.
4. **Build Command:** `cd ../.. && pnpm install && pnpm --filter api build` (from repo root).
5. **Start Command:** `node dist/main.js` (run from `packages/api`; Render often keeps cwd as root directory).
6. Add the same environment variables as in Option A; set `CORS_ORIGIN` to your Vercel URL.
7. Deploy and copy the service URL.

---

## Step 4: Connect frontend to API

1. In **Vercel** → your project → **Settings** → **Environment Variables**, set:
   - `NEXT_PUBLIC_API_URL` = the API URL from Step 3 (no trailing slash).
2. **Redeploy** the Vercel project (Deployments → … → Redeploy) so the new value is used.

---

## Step 5: Production database migrations

Run migrations once against your production Supabase database:

```bash
# Set production DB URLs (Supabase) in .env or export them, then:
pnpm db:migrate:deploy
```

Or with explicit URLs:

```bash
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." pnpm db:migrate:deploy
```

This runs `prisma migrate deploy` (applies pending migrations without creating new ones). Use the same Supabase connection strings you configured on Railway/Render.

---

## Git workflow after setup

- **Production:** Push or merge to `main` → Vercel deploys the web app. If the API is connected to the same repo on Railway/Render, it will redeploy on the same push.
- **Preview:** Push to another branch → Vercel creates a preview URL. Use production API or a separate preview API by setting `NEXT_PUBLIC_API_URL` per environment in Vercel if needed.

---

## CORS

The API must allow your Vercel origin. Set `CORS_ORIGIN` on the API host to your production (and optionally preview) URLs, e.g.:

- `https://labcore-xxx.vercel.app`
- Or a comma-separated list for multiple origins. Avoid `*` when using credentials.

---

## Troubleshooting

- **Vercel build fails (workspace deps):** Ensure Root Directory is `packages/web` and that `packages/web/vercel.json` is present (install from repo root, build from `packages/web`).
- **API not reachable from web:** Check `NEXT_PUBLIC_API_URL` and CORS. Ensure `CORS_ORIGIN` on the API includes your Vercel domain.
- **DB errors in API:** Confirm `DATABASE_URL` and `DIRECT_URL` on the API host point to Supabase and that migrations have been run with `pnpm db:migrate:deploy`.
