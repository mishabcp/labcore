# Security and Regulatory Compliance

**LabCore LIMS** | Technical Document | February 2025

---

## 1. Overview

LabCore processes sensitive patient health data subject to multiple Indian regulations. This document maps each regulatory requirement to concrete technical implementations and defines the security architecture.

**Deployment note:** The free-tier stack (Vercel + Supabase) may store data in regions outside India. For regulated production with full DPDP/NABL compliance, use India-hosted infrastructure.

---

## 2. Data Encryption

### 2.1 Encryption at Rest

| Layer | Method | Details |
|-------|--------|---------|
| Database (Supabase PostgreSQL) | AES-256 | Supabase encryption at rest (provider-managed keys) |
| File storage (Supabase Storage) | AES-256 | Server-side encryption on all objects by default |
| Client-side (IndexedDB) | Browser-managed | IndexedDB data is protected by browser's same-origin policy; sensitive fields (patient mobile, email) encrypted at the application level using the Web Crypto API before storing locally |
| Backups | AES-256 | Supabase automated backups inherit encryption |

### 2.2 Encryption in Transit

| Path | Protocol | Details |
|------|----------|---------|
| Browser to API | TLS 1.3 | Enforced via Vercel; HSTS header with 1-year max-age |
| API to Database | TLS 1.2+ | Supabase SSL/TLS enforced; secure connection string |
| API to Supabase Storage | HTTPS | Supabase client uses HTTPS by default |
| API to external services | HTTPS | All external API calls over TLS |

### 2.3 Key Management

- Supabase and Vercel use provider-managed encryption keys for data at rest and in transit
- Database and storage keys are managed by Supabase; no customer-managed KMS on free tier
- No encryption keys or secrets stored in application code; credentials in Vercel environment variables

---

## 3. Authentication and Session Security

### 3.1 Password Security

| Requirement | Implementation |
|-------------|---------------|
| Hashing algorithm | bcrypt with cost factor 12 |
| Minimum password length | 8 characters |
| Complexity requirements | At least one uppercase letter and one digit |
| Password storage | Only bcrypt hash stored; plaintext never persisted or logged |
| Password reset | OTP sent to registered email; OTP valid for 10 minutes |

### 3.2 Session Management

| Requirement | Implementation |
|-------------|---------------|
| Access token | JWT, signed with RS256 (asymmetric), 1-hour expiry |
| Refresh token | Opaque random string (256-bit), stored in Supabase (Postgres session table) with 7-day TTL |
| Token storage | httpOnly, Secure, SameSite=Strict cookies (not localStorage) |
| Session timeout | Configurable per lab (default: 8 hours of inactivity) |
| Concurrent sessions | Allowed on multiple devices; maximum 3 active sessions per user |
| Session revocation | Admin can force-logout any user; refresh token deleted from session store (Supabase) |

### 3.3 Two-Factor Authentication (2FA)

- OTP-based 2FA via email for admin users
- Optional for other roles (configurable per lab)
- OTP valid for 5 minutes, 6-digit numeric code
- Rate-limited: maximum 5 OTP requests per phone number per hour

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Role Definitions

| Role | Level | Data Access | Feature Access |
|------|-------|-------------|----------------|
| Admin | 50 | All lab data | All features including settings, user management, billing configuration, dashboard |
| Pathologist | 40 | All patient/result/report data | Result authorisation, report signing, interpretive comments, dashboard (read-only) |
| Senior Technician | 30 | Sample and result data | Result entry, result review, sample management, worklist |
| Technician | 20 | Sample and result data (own department) | Result entry, sample collection/receiving |
| Front Desk | 10 | Patient and billing data | Patient registration, order entry, billing, payment collection, report delivery |

### 4.2 Permission Matrix (MVP Endpoints)

| Action | Admin | Pathologist | Sr. Tech | Technician | Front Desk |
|--------|:-----:|:-----------:|:--------:|:----------:|:----------:|
| Create/edit users | Yes | -- | -- | -- | -- |
| Configure lab settings | Yes | -- | -- | -- | -- |
| Register patient | Yes | -- | -- | -- | Yes |
| Create order | Yes | -- | -- | -- | Yes |
| Collect/receive sample | Yes | Yes | Yes | Yes | -- |
| Reject sample | Yes | Yes | Yes | -- | -- |
| Enter results | Yes | Yes | Yes | Yes | -- |
| Review results | Yes | Yes | Yes | -- | -- |
| Authorise results | Yes | Yes | -- | -- | -- |
| Amend authorised report | Yes | Yes | -- | -- | -- |
| Generate/view report | Yes | Yes | Yes | -- | Yes |
| Send report (WhatsApp) | Yes | Yes | -- | -- | Yes |
| View/manage billing | Yes | -- | -- | -- | Yes |
| Apply discount (>10%) | Yes | -- | -- | -- | -- |
| View dashboard | Yes | Yes (read) | -- | -- | -- |
| Export data | Yes | -- | -- | -- | -- |
| View audit logs | Yes | -- | -- | -- | -- |

### 4.3 Enforcement

- RBAC is enforced at the **API layer** via NestJS Guards (not just UI hiding)
- Every API endpoint declares its minimum required role
- JWT payload includes `role`; guard checks `user.role >= endpoint.requiredRole`
- Attempting an unauthorised action returns HTTP 403 with an audit log entry
- RLS policies at the database level provide a second layer of tenant isolation independent of application logic

---

## 5. Audit Trail Implementation

### 5.1 What Is Logged

| Event Category | Logged Actions |
|---------------|----------------|
| Patient data | Create, update, delete (soft) patient records |
| Orders | Create, amend, cancel orders |
| Samples | Collect, receive, reject, dispose |
| Results | Enter, edit, review, authorise, amend |
| Reports | Generate, amend, deliver (with channel and recipient) |
| Billing | Create invoice, apply discount, record payment, cancel invoice |
| User management | Create, edit, deactivate, password reset, role change |
| Authentication | Login (success/failure), logout, session timeout, 2FA attempts |
| Settings | Any configuration change (test master, rate cards, lab profile) |

### 5.2 Audit Log Record Structure

Each audit log entry contains:
- `user_id`: Who performed the action
- `action`: What action was performed (create, update, delete, authorise, etc.)
- `entity_type`: Which entity (patient, order, result, etc.)
- `entity_id`: Which specific record
- `old_values`: Previous values (JSONB, for updates)
- `new_values`: New values (JSONB)
- `ip_address`: Client IP address
- `user_agent`: Browser/device identifier
- `created_at`: Timestamp (server clock, UTC)

### 5.3 Immutability Guarantees

- The `audit_logs` table has no UPDATE or DELETE permissions granted to the application database user
- A PostgreSQL trigger prevents any modification:

```sql
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log records cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
```

- Audit logs are retained indefinitely (no TTL, no archival deletion)
- Logs exportable as CSV/JSON for NABL assessor review

---

## 6. NABL / ISO 15189:2022 Compliance Mapping

ISO 15189:2022 defines requirements for quality and competence in medical laboratories. Below is a mapping of key clauses to LabCore features.

| ISO 15189:2022 Clause | Requirement | LabCore Implementation | Phase |
|-----------------------|-------------|----------------------|-------|
| 7.3 - Pre-examination | Sample identification, patient ID, requisition management | Barcode/QR labelling, patient registration, order entry | MVP |
| 7.3 - Sample collection | Record collector, date/time, condition | Sample collection workflow with user and timestamp | MVP |
| 7.3 - Sample rejection | Documented rejection criteria and process | Rejection with reason codes, notifications, audit log | MVP |
| 7.3 - Sample transport | Chain of custody tracking | Sample events log with timestamps at each transfer point | MVP |
| 7.4 - Examination procedures | Documented procedures, validated methods | Test master with defined parameters, reference ranges, and methods | MVP |
| 7.4 - Quality control | IQC (Westgard), EQC/PT, documented corrective actions | IQC with Westgard rules and L-J charts; EQA tracking | Phase 2/3 |
| 7.5 - Result review | Delta check, critical value notification, multi-level authorisation | Delta check, panic value alerts, configurable approval workflow | MVP/Phase 2 |
| 7.5 - Result reporting | Standardised report format, digital signature, QR verification | Customisable PDF reports with signature, NABL logo, QR code | MVP |
| 7.5 - Report amendment | Version control, amendment documentation, re-notification | Report versioning, amendment reason, "Amended" watermark, re-send | MVP |
| 8.2 - Document control | Controlled SOP repository, version management, review scheduling | Document management module with versioning and alerts | Phase 3 |
| 8.5 - Corrective action | CAPA tracking with root cause analysis | CAPA module with tracking and documentation | Phase 3 |
| 8.7 - Nonconformance | Incident reporting, investigation, corrective action | Non-conformance module | Phase 3 |
| 8.3 - Internal audit | Audit scheduling, findings, follow-up | Internal audit scheduling module | Phase 3 |
| 6.3 - Equipment | Calibration logs, maintenance schedules, AMC tracking | Equipment management with due date alerts | Phase 3 |
| 6.4 - Reagents | Lot tracking, expiry management, FIFO consumption | Inventory with lot/expiry tracking | Phase 2 |
| 6.2 - Personnel | Competency records, training logs | Staff competency module | Phase 3 |
| 7.1 - Audit trail | Immutable record of all data changes | Append-only audit_logs table with trigger protection | MVP |

---

## 7. DPDP Act (Digital Personal Data Protection Act, 2023) Compliance

### 7.1 Consent Management

| Requirement | Implementation |
|-------------|---------------|
| Informed consent | Consent capture screen at patient registration; patient (or guardian) acknowledges data collection purpose |
| Purpose limitation | Consent text specifies: data collected for diagnostic testing, report delivery, and legally mandated record keeping |
| Consent record | Consent timestamp, version of consent text, and patient acknowledgement stored in the `patients` table (`consent_given_at`, `consent_version`) |
| Withdrawal | Patient can request consent withdrawal via the lab; system flags the record but retains data required by law (medical records retention) |

### 7.2 Data Minimisation and Retention

| Requirement | Implementation |
|-------------|---------------|
| Minimum necessary data | Only clinically and operationally necessary fields collected; optional fields clearly marked |
| Retention periods | Configurable per data type: patient records (10 years default, per ICMR guidelines), reports (10 years), billing (8 years per GST law), audit logs (indefinite) |
| Automated retention enforcement | Background job flags records past retention period; admin reviews and approves anonymisation/deletion |
| Anonymisation | Personal identifiers (name, mobile, email, address) replaced with hashed values; medical data retained for public health purposes if required |

### 7.3 Right to Erasure

| Requirement | Implementation |
|-------------|---------------|
| Erasure request | Patient submits request via lab; recorded in `data_requests` table |
| Scope | Personal identifiers deleted/anonymised; medical records retained if legally required (with justification documented) |
| Timeline | Processed within 30 days per DPDP Act requirements |
| Confirmation | Patient notified of completion via email |
| Audit | Erasure action logged in audit trail (including legal basis for any retained data) |

### 7.4 Data Breach Management

| Requirement | Implementation |
|-------------|---------------|
| Detection | Sentry alerts for unusual access patterns; Vercel/Supabase metrics for unauthorised API access attempts |
| Containment | Incident response procedure: revoke affected tokens, isolate compromised components, assess scope |
| Notification | Data Protection Board of India notified within 72 hours per DPDP Act; affected patients notified |
| Documentation | Breach logged in `security_incidents` table with timeline, scope, impact assessment, and remediation actions |

---

## 8. ABDM Integration Requirements (Phase 3)

### 8.1 ABHA ID Integration

| Requirement | Implementation |
|-------------|---------------|
| ABHA ID verification | At patient registration, optional ABHA ID field; verified via ABDM API (demographic + OTP authentication) |
| ABHA creation | Optionally assist patients in creating an ABHA ID via the ABDM registration flow |
| Linking | ABHA ID stored in `patients.abha_id`; linked to patient's health records |

### 8.2 Health Information Provider (HIP) Role

| Requirement | Implementation |
|-------------|---------------|
| HIP registration | LabCore registered as an HIP with ABDM; each lab registered on the Health Facility Registry (HFR) |
| Consent-based data sharing | When patient or linked provider requests records, LabCore generates consent artefact via ABDM consent manager; data shared only upon valid consent |
| FHIR R4 resources | Lab reports converted to FHIR R4 `DiagnosticReport` resources with `Observation` resources for each parameter |
| Data push | Encrypted data pushed to ABDM HIU (Health Information User) via the ABDM gateway |

### 8.3 FHIR R4 Resource Mapping

| LabCore Entity | FHIR R4 Resource |
|---------------|-----------------|
| Patient | Patient |
| Order | ServiceRequest |
| Result + Values | DiagnosticReport + Observation(s) |
| Referring Doctor | Practitioner |
| Lab | Organization |

---

## 9. Backup and Disaster Recovery

### 9.1 Backup Strategy

| Component | Backup Method | Frequency | Retention |
|-----------|--------------|-----------|-----------|
| PostgreSQL (Supabase) | Automated backups | Per Supabase plan (daily on paid) | Per plan |
| Supabase Storage (files) | Versioning / retention | Per Supabase plan | Per plan |
| Sessions (Postgres table) | Not backed up separately (part of DB backup) | -- | -- |
| Application code | Git (GitHub) | Every commit | Indefinite |

### 9.2 Recovery Objectives

| Metric | Target |
|--------|--------|
| RPO (Recovery Point Objective) | Depends on Supabase backup frequency (e.g. daily); improve with Supabase Pro if needed |
| RTO (Recovery Time Objective) | < 1 hour (restore from Supabase backup + redeploy on Vercel) |

### 9.3 Disaster Recovery Procedure

1. **Database failure**: Restore from Supabase backup; Supabase High Availability (on paid plans) reduces single-point failure risk
2. **Application failure**: Vercel automatically routes traffic to healthy serverless instances; redeploy from Git if needed
3. **Region failure** (catastrophic): Restore from Supabase backup in a new project/region; point DNS to new deployment
4. **Data corruption**: Restore from latest Supabase backup; consider Supabase Pro for point-in-time recovery if required

### 9.4 Backup Testing

- Monthly restore drill: restore a database snapshot to a test environment and verify data integrity
- Quarterly DR drill: simulate region failover and measure actual RTO

---

## 10. Infrastructure Security

### 10.1 Network Security

| Control | Implementation |
|---------|---------------|
| HTTPS | All traffic via Vercel over TLS; Supabase accepts only secure connections |
| Supabase | Database and storage behind Supabase auth and Row Level Security; API uses service role only server-side |
| IP whitelisting | Admin panel access restricted to configured IP ranges (optional, per-lab setting) |
| DDoS protection | Vercel edge and rate limiting; optional Cloudflare in front for additional DDoS/WAF |
| WAF | Optional Cloudflare (free tier) in front of Vercel for managed rule sets (SQL injection, XSS, common exploits) |

### 10.2 Application Security

| Control | Implementation |
|---------|---------------|
| Input validation | All inputs validated at API layer using class-validator (NestJS); reject malformed data before processing |
| SQL injection prevention | Prisma ORM parameterises all queries; no raw SQL string concatenation |
| XSS prevention | React's default escaping + Content-Security-Policy headers |
| CSRF protection | SameSite=Strict cookies + CSRF token for state-changing requests |
| Rate limiting | 100 requests/minute per IP (configurable); login endpoint: 10 attempts/minute |
| Dependency scanning | GitHub Dependabot for automated vulnerability alerts on npm packages |
| Secrets management | Environment variables in Vercel for database URL, API keys, JWT signing keys; no secrets in code or committed files |

### 10.3 Monitoring and Alerting

| Signal | Tool | Alert |
|--------|------|-------|
| Application errors | Sentry | Slack/email alert on new error types or error rate spike |
| API latency | Vercel dashboard / Sentry | Monitor serverless duration and errors |
| Failed logins | Application log + Sentry | Alert if > 20 failed logins from same IP in 10 minutes |
| Database and storage | Supabase dashboard | Monitor connections and usage; upgrade plan if approaching limits |

---

## 11. Vulnerability Management

| Activity | Frequency | Tool |
|----------|-----------|------|
| Dependency vulnerability scan | Continuous (on PR) | GitHub Dependabot + npm audit |
| Static code analysis | On every PR | ESLint security rules + SonarQube (P2) |
| Container image scan | On build | Optional if using containers (e.g. GitHub Container Registry); Vercel deploys from source, no custom image scan on free tier |
| Penetration testing | Annually (or before major release) | Third-party security firm |
| Security header audit | Monthly | Mozilla Observatory / SecurityHeaders.com |
| OWASP Top 10 review | Before each phase launch | Manual review checklist |
