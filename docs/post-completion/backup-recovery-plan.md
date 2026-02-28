# LabCore LIMS — Backup & Recovery Plan

**Version**: 1.0 · **Last Updated**: February 2026

---

## Table of Contents

1. [Data Inventory](#1-data-inventory)
2. [Backup Strategy](#2-backup-strategy)
3. [Backup Schedule & Retention](#3-backup-schedule--retention)
4. [Audit Log Protection](#4-audit-log-protection)
5. [Report & File Storage](#5-report--file-storage)
6. [Recovery Procedures](#6-recovery-procedures)
7. [Disaster Recovery Scenarios](#7-disaster-recovery-scenarios)
8. [RPO / RTO Targets](#8-rpo--rto-targets)
9. [Testing the Recovery Plan](#9-testing-the-recovery-plan)

---

## 1. Data Inventory

| Data Category       | Storage Location           | Sensitivity  | Retention Requirement       |
|---------------------|----------------------------|--------------|-----------------------------|
| Patient records     | PostgreSQL (Supabase)      | High (PII)   | 10 years (ICMR guidelines)  |
| Test orders         | PostgreSQL (Supabase)      | High         | 10 years                    |
| Sample events       | PostgreSQL (Supabase)      | Medium       | 10 years                    |
| Test results        | PostgreSQL (Supabase)      | High         | 10 years                    |
| Reports (metadata)  | PostgreSQL (Supabase)      | High         | 10 years                    |
| Report PDFs         | Supabase Storage / On-demand generation | High | 10 years            |
| Invoices & payments | PostgreSQL (Supabase)      | Medium       | 8 years (GST law)           |
| Audit logs          | PostgreSQL (Supabase)      | High         | Indefinite (never deleted)  |
| User accounts       | PostgreSQL (Supabase)      | Medium       | Duration of account         |
| Lab configuration   | PostgreSQL (Supabase)      | Low          | Current                     |
| Application code    | GitHub                     | Low          | Indefinite (Git history)    |

---

## 2. Backup Strategy

### 2.1 Database (Supabase PostgreSQL)

| Backup Method       | Tier       | Details                                          |
|---------------------|------------|--------------------------------------------------|
| Daily automated     | Free tier  | Supabase takes daily snapshots; available in dashboard |
| Point-in-Time Recovery | Pro tier | Restore to any second within retention window    |
| Manual SQL dump     | Any tier   | Export via `pg_dump` or Supabase SQL editor       |

### 2.2 File Storage (Supabase Storage)

Lab logos, pathologist signatures, and any uploaded files are stored in Supabase Storage, which is part of the Supabase backup.

### 2.3 Application Code

All source code is backed up via **Git** (GitHub). Every commit is preserved indefinitely.

### 2.4 Generated PDFs

Reports are generated on-demand using the pdf-service (Puppeteer). The source data (results, patient info, lab settings) is in the database. PDFs can be regenerated from the database at any time, so they do not require separate backup.

---

## 3. Backup Schedule & Retention

| Component           | Frequency    | Retention        | Responsible        |
|---------------------|-------------|------------------|--------------------|
| Database (auto)     | Daily        | Per Supabase plan| Supabase (automatic)|
| Database (manual)   | Weekly       | 30 days minimum  | IT Admin           |
| Code (Git)          | Every commit | Indefinite       | Developers         |

### Recommended Manual Backup Procedure

1. Connect to your Supabase project.
2. Open the **SQL Editor** and run:
   ```sql
   -- Verify data counts
   SELECT 'patients' AS entity, COUNT(*) FROM patients
   UNION ALL SELECT 'orders', COUNT(*) FROM orders
   UNION ALL SELECT 'results', COUNT(*) FROM results
   UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;
   ```
3. Use `pg_dump` to create a manual backup:
   ```bash
   pg_dump "<DIRECT_URL>" --format=custom --file=labcore-backup-$(date +%Y%m%d).dump
   ```
4. Store the backup file in a secure, off-site location (e.g. encrypted cloud storage).

---

## 4. Audit Log Protection

Audit logs receive special protection in LabCore:

- **Immutable**: A PostgreSQL trigger prevents any UPDATE or DELETE on the `audit_logs` table.
- **Append-only**: New entries are always inserted; existing entries cannot be modified.
- **Indefinite retention**: Audit logs are never deleted, archived, or expired.
- **Export**: Admins can export audit logs as CSV via the `/audit-logs/export` API endpoint.

> Even a database administrator cannot modify audit logs without first disabling the trigger at the PostgreSQL superuser level.

---

## 5. Report & File Storage

| File Type             | Storage                | Backup Coverage                          |
|-----------------------|------------------------|------------------------------------------|
| Lab logo              | Supabase Storage       | Included in Supabase backup              |
| Pathologist signature | Supabase Storage       | Included in Supabase backup              |
| Generated PDFs        | On-demand (Puppeteer)  | Regenerated from database data           |

Since report PDFs are generated on-demand from database records, losing a PDF file does not mean data loss — the PDF can be regenerated at any time from the stored results, patient data, and lab settings.

---

## 6. Recovery Procedures

### 6.1 Restoring from Supabase Daily Backup (Free Tier)

1. Go to **Supabase Dashboard → Project → Database → Backups**.
2. Select the backup point to restore from.
3. Follow the Supabase restore wizard.
4. Verify data integrity (see §9 below).

### 6.2 Restoring from Point-in-Time Recovery (Pro Tier)

1. Go to **Supabase Dashboard → Database → Point in Time Recovery**.
2. Select the exact timestamp to restore to.
3. Supabase creates a new database branch at that point.
4. Point your API's `DATABASE_URL` and `DIRECT_URL` to the restored database.
5. Verify data integrity.

### 6.3 Restoring from Manual SQL Dump

1. Create a new Supabase project (or use an existing test project).
2. Restore the dump:
   ```bash
   pg_restore --clean --no-owner --dbname="<NEW_DATABASE_URL>" labcore-backup-YYYYMMDD.dump
   ```
3. Apply any pending migrations:
   ```bash
   DATABASE_URL="<new-url>" DIRECT_URL="<new-url>" pnpm db:migrate:deploy
   ```
4. Update the API's environment variables to point to the new database.
5. Redeploy the API.
6. Verify data integrity.

### 6.4 Post-Recovery Verification

After any restore, verify:
- [ ] `GET <API_URL>/health` returns HTTP 200
- [ ] Login works with expected credentials
- [ ] Patient, order, and result counts match expectations
- [ ] Audit log immutability trigger is active (try an UPDATE on `audit_logs` — it should fail)
- [ ] Reports can be generated from existing authorised results

---

## 7. Disaster Recovery Scenarios

### Scenario 1: Database Corruption

1. Identify the corruption scope.
2. Restore from the latest Supabase backup (or Point-in-Time Recovery on Pro).
3. Verify data integrity.
4. Investigate root cause.

### Scenario 2: Supabase Project Unavailable

1. If the Supabase project is paused (free tier inactivity): Reactivate from the Supabase dashboard.
2. If a Supabase outage: Wait for Supabase status to resolve, or restore from a manual SQL dump to a new project/provider.
3. Update API environment variables if the database URL changed.

### Scenario 3: Vercel Frontend Unavailable

1. Vercel has global redundancy. Wait for recovery, or:
2. Build and deploy the frontend to an alternative host (e.g. Netlify).
3. Update DNS if using a custom domain.

### Scenario 4: API Host (Railway/Render) Unavailable

1. Redeploy the API to an alternative host.
2. Update `NEXT_PUBLIC_API_URL` in Vercel environment variables.
3. Redeploy the Vercel frontend.

### Scenario 5: Accidental Data Deletion

1. Determine what was deleted and when.
2. Restore from the backup taken before the deletion.
3. **Audit logs** cannot be accidentally deleted (trigger-protected).
4. For patient data: check the `deletedAt` field — LabCore uses soft deletes for patients.

---

## 8. RPO / RTO Targets

| Metric | Target                    | Notes                                        |
|--------|--------------------------|----------------------------------------------|
| **RPO** (Recovery Point Objective) | ≤ 24 hours (Free tier) | Daily backups; improve to minutes with Supabase Pro (PITR) |
| **RTO** (Recovery Time Objective) | < 1 hour              | Restore from backup + redeploy on Vercel                    |

> **Recommendation for production**: Upgrade to Supabase Pro for Point-in-Time Recovery, which reduces RPO from 24 hours to minutes.

---

## 9. Testing the Recovery Plan

### Monthly: Backup Verification

1. Download or access the latest Supabase backup.
2. Restore to a **test environment** (not production).
3. Run the post-recovery verification checklist (§6.4).
4. Document results and any issues found.

### Quarterly: Full DR Drill

1. Simulate a complete database failure.
2. Restore from backup to a new Supabase project.
3. Deploy the API and frontend pointing to the restored database.
4. Measure actual RTO.
5. Run the full end-to-end flow: patient → order → result → authorise → report.
6. Document results and update this plan if needed.

---

*For deployment procedures, see the [Deployment Guide](deployment-guide.md).*
*For system configuration, see the [Admin Guide](admin-guide.md).*
