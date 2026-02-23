# LabCore LIMS

Affordable Laboratory Information Management System for small diagnostic and pathology labs (India, Kerala-first).

## Stack

- **Frontend**: Next.js (App Router), Tailwind CSS, TypeScript
- **Backend**: NestJS, Prisma, PostgreSQL (Supabase)
- **PDF**: Puppeteer (pdf-service package)
- **Hosting**: Vercel + Supabase (free tier)

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` and `DIRECT_URL`: Supabase PostgreSQL connection strings (or use local Postgres via Docker).
   - `NEXT_PUBLIC_API_URL`: e.g. `http://localhost:3001` for local dev.
   - `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: at least 32 characters each (required for auth).

3. **Generate Prisma client**

   ```bash
   pnpm db:generate
   ```

   (Requires `DATABASE_URL` and `DIRECT_URL` in `.env`. Use dummy values if you only need the client without a DB.)

4. **Database** (optional for first run)

   - **Supabase**: Create a project, copy the connection strings into `.env`, then run:
     ```bash
     pnpm db:push
     pnpm db:seed
     ```
   - **Local**: From repo root:
     ```bash
     docker compose -f docker/docker-compose.yml up -d
     ```
     Then set `DATABASE_URL` and `DIRECT_URL` to `postgresql://labcore:labcore@localhost:5432/labcore` and run:
     ```bash
     pnpm db:push
     pnpm db:seed
     ```

   The seed creates a demo lab and user so you can log in. **First-time login:** mobile `9876543210`, password `demo123`.

5. **Run locally**

   ```bash
   pnpm dev
   ```

   This starts:

   - **Web**: http://localhost:3000
   - **API**: http://localhost:3001

   The home page calls the API health endpoint to verify connectivity.

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `pnpm dev`     | Start web + api in development |
| `pnpm build`   | Build all packages             |
| `pnpm db:generate` | Generate Prisma client     |
| `pnpm db:push` | Push schema to DB (no migrations) |
| `pnpm db:seed` | Seed demo lab and user (run after db:push for first-time login) |
| `pnpm db:migrate` | Create and run migrations  |
| `pnpm db:studio` | Open Prisma Studio          |

## Monorepo layout

- `packages/web` – Next.js PWA
- `packages/api` – NestJS API
- `packages/shared` – Shared types and constants
- `packages/pdf-service` – Puppeteer PDF generation
- `prisma` – Schema and migrations (root)
- `docs` – Product and technical documentation

## Documentation

See the `docs/` folder for market research, product scope, PRD, architecture, database schema, security, and go-to-market. For production deployment (Vercel + Supabase), see [docs/deployment.md](docs/deployment.md).
