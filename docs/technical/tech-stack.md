# Technology Stack Decision

**LabCore LIMS** | Technical Document | February 2025

---

## 1. Decision Criteria

Every technology choice is evaluated against these criteria, weighted for LabCore's context:

| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Small-team productivity | High | LabCore is built by a small team; we need maximum output per developer |
| Ecosystem and hiring | High | Technology must have a large talent pool in India and abundant open-source libraries |
| Cost efficiency | High | Infrastructure costs must stay low to support INR 499/mo pricing |
| Offline-first capability | High | Core architectural requirement for semi-urban India |
| Performance | Medium | Must be fast enough for real-time lab workflows but not at the expense of development speed |
| Maturity and stability | Medium | No bleeding-edge experiments; production-proven technologies only |

---

## 2. Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (React) + TypeScript | Latest stable |
| **Styling** | Tailwind CSS | Latest stable |
| **PWA / Offline** | Workbox (service worker toolkit) | Latest stable |
| **Client-side DB** | IndexedDB via Dexie.js | Latest stable |
| **Backend** | Node.js + NestJS (TypeScript) | Node 20 LTS, NestJS latest |
| **Database** | PostgreSQL | 16.x |
| **ORM** | Prisma | Latest stable |
| **Cache** | Supabase (Postgres) or optional Vercel KV | -- |
| **PDF Generation** | Puppeteer (headless Chrome) | Latest stable |
| **Barcode/QR** | JsBarcode + qrcode (npm) | Latest stable |
| **WhatsApp Sharing** | wa.me deep links (zero cost) | -- |
| **File Storage** | Supabase Storage | -- |
| **Hosting** | Vercel (frontend + API) | -- |
| **Email** | Resend (free tier) | -- |
| **Containerisation** | Docker + Docker Compose (local) | Latest stable |
| **CI/CD** | GitHub Actions | -- |
| **Monitoring** | Sentry + Vercel dashboard | -- |
| **i18n** | next-intl (frontend), nestjs-i18n (backend) | Latest stable |

---

## 3. Detailed Decisions and Rationale

### 3.1 Frontend: Next.js + React + TypeScript

**Decision**: Next.js with TypeScript and React for the web application.

| Factor | Assessment |
|--------|------------|
| Why Next.js over plain React (CRA/Vite)? | Server-side rendering for initial page load speed on slow connections, built-in API routes for simple endpoints, file-based routing reduces boilerplate, excellent PWA support via next-pwa |
| Why TypeScript? | Catches bugs at compile time, improves IDE auto-complete for faster development, self-documenting code -- critical for a small team where anyone may touch any file |
| Why not Angular/Vue? | React has the largest ecosystem and talent pool in India; Angular is more opinionated than needed; Vue is excellent but smaller ecosystem for Indian hiring |
| PWA support | next-pwa wraps Workbox for service worker management; enables offline caching, background sync, and installable app experience without a separate mobile app |

### 3.2 Styling: Tailwind CSS

**Decision**: Tailwind CSS for all styling.

| Factor | Assessment |
|--------|------------|
| Why Tailwind? | Utility-first approach eliminates naming fatigue, produces consistent UI, pairs well with component-based React, excellent responsive design support |
| Why not Material UI / Ant Design? | Component libraries impose opinionated design that is hard to customise for LabCore's specific UI needs; Tailwind gives full control with less CSS |
| Accessibility | Tailwind provides built-in responsive and dark mode utilities; combined with headless UI libraries (Radix UI, Headless UI) for accessible interactive components |

### 3.3 Offline Storage: IndexedDB via Dexie.js

**Decision**: Dexie.js as the IndexedDB wrapper for client-side offline storage.

| Factor | Assessment |
|--------|------------|
| Why IndexedDB? | Browser-native, supports structured data, large storage limits (100MB+), works in all modern browsers, no plugin required |
| Why Dexie.js? | Clean Promise-based API over raw IndexedDB, supports versioned schema migrations, excellent documentation, small bundle size (~20KB) |
| Why not SQLite (via sql.js/wa-sqlite)? | WebAssembly-based SQLite adds bundle size and complexity; IndexedDB is sufficient for caching and offline queue management |
| Sync strategy | Offline writes go to IndexedDB with a sync queue; when online, background sync pushes changes to the server via API; server responds with conflict resolution if needed |

### 3.4 Backend: Node.js + NestJS

**Decision**: NestJS framework on Node.js with TypeScript.

| Factor | Assessment |
|--------|------------|
| Why Node.js? | Same language (TypeScript) as frontend -- shared types, shared validation schemas, one language for the whole team to master; excellent async I/O for handling concurrent API requests |
| Why NestJS over Express/Fastify? | NestJS provides opinionated structure (modules, controllers, services, guards) that keeps code organised as the project grows; built-in support for validation (class-validator), authentication (Passport), and dependency injection; Fastify adapter available for performance |
| Why not Python (Django/FastAPI)? | Switching languages between frontend and backend increases cognitive load for a small team; Node.js/TypeScript unifies the stack |
| Why not Go/Rust? | Overkill for this use case; development speed matters more than raw performance for a CRUD-heavy application |

### 3.5 Database: PostgreSQL

**Decision**: PostgreSQL as the primary relational database.

| Factor | Assessment |
|--------|------------|
| Why PostgreSQL? | ACID compliance essential for medical data, JSON/JSONB support for flexible schemas (test parameter definitions vary per test), full-text search for patient lookup, mature Row Level Security for multi-tenancy, excellent performance at our scale |
| Why not MySQL? | PostgreSQL's JSONB support, better default isolation levels, and Row Level Security give it an edge for multi-tenant SaaS |
| Why not MongoDB? | Medical lab data is inherently relational (patient has orders, orders have samples, samples have results); forcing this into a document model creates complexity; PostgreSQL's JSONB gives us document flexibility where needed |
| Multi-tenancy | lab_id column on every table; Row Level Security policies enforce tenant isolation at the database level |
| Scaling | Single instance sufficient for initial 200+ labs; read replicas added when needed |

### 3.6 ORM: Prisma

**Decision**: Prisma as the database ORM.

| Factor | Assessment |
|--------|------------|
| Why Prisma? | Type-safe queries generated from schema, auto-generated TypeScript types shared with frontend, excellent migration system, intuitive schema language, strong community |
| Why not TypeORM/Sequelize? | Prisma's type generation is superior; TypeORM's decorator-based approach is more verbose; Sequelize is JavaScript-first with weaker TypeScript support |
| Why not raw SQL? | Prisma handles 90% of queries cleanly; raw SQL available via Prisma's `$queryRaw` for complex analytics queries |

### 3.7 Cache: Supabase (Postgres) or optional Vercel KV

**Decision**: Sessions and cache in Supabase (Postgres table) to keep the stack to Vercel + Supabase; optional Vercel KV if a dedicated cache is needed later.

| Factor | Assessment |
|--------|------------|
| Purpose | Session store for JWT refresh tokens, cache for frequently accessed data (test master, rate cards, lab profile), rate limiting |
| Why Supabase Postgres? | Single provider with database; session table with TTL or cleanup job; no separate Redis to manage on free tier |
| Optional Vercel KV | If sub-millisecond cache or pub/sub is required later, Vercel KV (Upstash) integrates with Vercel and stays within the same deployment story |

### 3.8 PDF Generation: Puppeteer

**Decision**: Puppeteer (headless Chrome) for generating lab report PDFs.

| Factor | Assessment |
|--------|------------|
| Why Puppeteer? | Renders HTML/CSS to pixel-perfect PDF; we design report templates as HTML (same technology as the frontend), allowing full control over layout, fonts, images, and QR codes |
| Why not PDFKit/jsPDF? | Programmatic PDF libraries require manual coordinate-based layout; HTML-to-PDF via Puppeteer is faster to develop and easier to customise |
| Performance | Report generation target: < 3 seconds per report; Puppeteer instance pooled (reused across requests) to avoid cold-start overhead |
| Offline PDF | For offline mode, a lightweight client-side PDF library (e.g., html2pdf.js wrapping html2canvas + jsPDF) generates a preview PDF locally; the definitive PDF is generated server-side when online |

### 3.9 Barcode and QR Code: JsBarcode + qrcode

**Decision**: JsBarcode for barcode generation, qrcode (npm) for QR code generation.

| Factor | Assessment |
|--------|------------|
| JsBarcode | Generates Code 128, Code 39, and other standard barcode formats as SVG or canvas; lightweight; works in browser and Node.js |
| qrcode | Generates QR codes as SVG, canvas, or data URL; used for report verification QR codes and invoice tracking |
| Label printing | Barcode SVGs rendered in a print-optimised HTML template; printed via the browser's print dialog to a connected thermal printer |

### 3.10 WhatsApp Integration: wa.me Share Links

**Decision**: Use WhatsApp's free `wa.me` deep link protocol for report sharing. Zero cost, no API keys, no BSP partner required.

| Factor | Assessment |
|--------|------------|
| How it works | When staff clicks "Share via WhatsApp", the app generates a signed PDF download URL (Supabase Storage) and opens `https://wa.me/<patient_mobile>?text=<encoded_message_with_link>` in a new tab. WhatsApp opens with the message pre-filled; staff taps Send. |
| Why not Cloud API? | Meta Cloud API costs INR 0.50--1.00 per conversation and requires a BSP partner with monthly fees. For a product targeting INR 499/month labs, this cost is unsustainable. The wa.me approach delivers 90% of the value at zero cost. |
| Cost | INR 0 -- wa.me deep links are free and unlimited |
| Limitations | No automated background delivery (staff must tap Send), no delivery/read receipts, no template messages. These are acceptable trade-offs for the target segment. |
| Future upgrade path | When revenue supports it (Phase 3+), integrate WhatsApp Business API for automated delivery as an optional premium feature |

### 3.11 Hosting: Vercel (frontend + API)

**Decision**: Vercel for hosting the Next.js PWA and API (Next.js API routes or NestJS serverless on Vercel). Free tier supports hobby and small-team usage.

| Factor | Assessment |
|--------|------------|
| Why Vercel? | Zero-config deployment for Next.js, global edge network, serverless API support, generous free tier; single platform for frontend and API |
| Database and storage | Supabase provides PostgreSQL and file storage (see below); no separate hosting for data layer |
| Cost | INR 0 at MVP scale on Vercel and Supabase free tiers |
| Free tier and data residency | Free tier is suitable for MVP and cost-sensitive launch. For production with real patient data and full DPDP/NABL compliance (data in India), plan migration to India-hosted infrastructure (e.g. DigitalOcean Bangalore, AWS Mumbai) when scaling or when compliance requires it. |

### 3.12 Containerisation: Docker

**Decision**: Docker and Docker Compose for local development; production runs on Vercel (no ECS or container registry required).

| Factor | Assessment |
|--------|------------|
| Why Docker? | Consistent environment across development machines; same PostgreSQL and Redis (or Supabase local) in one command |
| Docker Compose | Used for local development (app + PostgreSQL + Redis in one command) |
| Production | Vercel deploys from Git (build and deploy); no container orchestration. For local parity, Supabase local or Docker Compose mirrors production data layer. |

### 3.13 CI/CD: GitHub Actions

**Decision**: GitHub Actions for continuous integration and deployment.

| Factor | Assessment |
|--------|------------|
| Why GitHub Actions? | Free for public repos, generous free tier for private repos, tight integration with GitHub (our code repository), YAML-based pipeline configuration, large marketplace of pre-built actions |
| Pipeline | Push to `main` triggers: lint, type-check, unit tests, build, deploy to staging; manual approval for production deploy |

### 3.14 Monitoring: Sentry + Vercel dashboard

**Decision**: Sentry for application error tracking; Vercel built-in metrics for deployment and traffic.

| Factor | Assessment |
|--------|------------|
| Sentry | Real-time error tracking with stack traces, user context, and release tracking; free tier (5k events/month) sufficient for initial scale; captures frontend (React) and backend (NestJS) errors |
| Vercel | Built-in dashboard for deployments, serverless function invocations, and traffic; no separate infrastructure monitoring on free tier |

---

## 4. Development Tools

| Tool | Purpose |
|------|---------|
| VS Code | Primary IDE with TypeScript, Tailwind, Prisma extensions |
| ESLint + Prettier | Code quality and formatting enforcement |
| Husky + lint-staged | Pre-commit hooks for linting and formatting |
| Jest | Unit testing for backend services and utility functions |
| React Testing Library | Component testing for frontend |
| Playwright | End-to-end testing for critical workflows |
| Storybook | Component development and documentation (P2) |

---

## 5. Dependency Management

| Layer | Package Manager | Lock File |
|-------|----------------|-----------|
| Frontend (Next.js) | pnpm | pnpm-lock.yaml |
| Backend (NestJS) | pnpm | pnpm-lock.yaml |
| Monorepo | pnpm workspaces | Shared at root |

**Why pnpm?** Faster installs, strict dependency isolation (no phantom dependencies), disk-efficient via content-addressable storage, excellent monorepo support via workspaces.

---

## 6. Monorepo Structure

```
labcore/
  packages/
    web/              # Next.js frontend (PWA)
    api/              # NestJS backend
    shared/           # Shared TypeScript types, validation schemas, constants
    pdf-service/      # Puppeteer-based PDF generation microservice
  prisma/
    schema.prisma     # Database schema
    migrations/       # Database migrations
  docker/
    docker-compose.yml
    Dockerfile.web
    Dockerfile.api
    Dockerfile.pdf
  docs/               # This documentation folder
  .github/
    workflows/        # GitHub Actions CI/CD pipelines
```

**Why monorepo?** Shared types between frontend and backend eliminate API contract drift; single repository simplifies CI/CD, code review, and versioning for a small team.
