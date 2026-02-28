# LabCore LIMS — Admin Guide

**Version**: 1.0 · **Last Updated**: February 2026

---

## Table of Contents

1. [User & Role Management](#1-user--role-management)
2. [Lab Profile Configuration](#2-lab-profile-configuration)
3. [Test Master Management](#3-test-master-management)
4. [Rate Card Management](#4-rate-card-management)
5. [Report Template Configuration](#5-report-template-configuration)
6. [Audit Log Monitoring](#6-audit-log-monitoring)
7. [System Health & Monitoring](#7-system-health--monitoring)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Security Configuration](#9-security-configuration)

---

## 1. User & Role Management

### 1.1 Access

Navigate to **Settings → Users** (visible only to Admin users).

### 1.2 Roles

LabCore uses five predefined roles with hierarchical access levels:

| Role              | Level | What They Can Do                                                                 |
|-------------------|-------|---------------------------------------------------------------------------------|
| Admin             | 50    | Full access — settings, user management, billing config, dashboard, all modules  |
| Pathologist       | 40    | Result authorisation, report signing, interpretive comments, dashboard (read)    |
| Senior Technician | 30    | Result entry & review, sample management, worklist                              |
| Technician        | 20    | Result entry, sample collection/receiving (own department)                       |
| Front Desk        | 10    | Patient registration, order entry, billing, payment collection, report delivery  |

### 1.3 Permission Matrix

| Action                    | Admin | Pathologist | Sr. Tech | Technician | Front Desk |
|---------------------------|:-----:|:-----------:|:--------:|:----------:|:----------:|
| Create/edit users         | ✅    | —           | —        | —          | —          |
| Configure lab settings    | ✅    | —           | —        | —          | —          |
| Register patient          | ✅    | —           | —        | —          | ✅         |
| Create order              | ✅    | —           | —        | —          | ✅         |
| Collect/receive sample    | ✅    | ✅          | ✅       | ✅         | —          |
| Reject sample             | ✅    | ✅          | ✅       | —          | —          |
| Enter results             | ✅    | ✅          | ✅       | ✅         | —          |
| Review results            | ✅    | ✅          | ✅       | —          | —          |
| Authorise results         | ✅    | ✅          | —        | —          | —          |
| Amend authorised report   | ✅    | ✅          | —        | —          | —          |
| View/manage billing       | ✅    | —           | —        | —          | ✅         |
| Apply discount (>10%)     | ✅    | —           | —        | —          | —          |
| View dashboard            | ✅    | ✅          | —        | —          | —          |
| View audit logs           | ✅    | —           | —        | —          | —          |

> **Note:** RBAC is enforced at the **API layer** (NestJS Guards), not just the UI. Attempting an unauthorised action returns HTTP 403 and creates an audit log entry.

### 1.4 Managing Users

**Adding a user:**
1. Click **+ Add User**.
2. Fill in: Name, Mobile number, Role, Password.
3. Optional fields: Email, Qualification, Registration No. (required for Pathologist role for digital signatures).
4. Click **Save**.

**Editing a user:**
1. Click **Edit** next to the user.
2. Modify any field and click **Save**.

**Resetting a password:**
1. Click the **Reset Password** button next to the user.
2. Enter the new password and confirm.

**Deactivating a user:**
1. Click **Deactivate** next to the user.
2. Confirm the action. The user can no longer log in, but their audit trail references are preserved.

---

## 2. Lab Profile Configuration

### 2.1 Access

Navigate to **Settings → Lab Profile**.

### 2.2 Fields

| Field              | Purpose                                    | Required |
|--------------------|-------------------------------------------|----------|
| Lab Name           | Displayed on reports and invoices          | Yes      |
| Address            | Printed on reports and invoices            | Yes      |
| Phone              | Contact info on reports                    | Yes      |
| Email              | Contact info on reports                    | No       |
| Website            | Printed on reports                         | No       |
| GSTIN              | GST Identification Number for invoicing    | Yes      |
| HSN/SAC Code       | For GST-compliant invoices                 | Yes      |
| NABL Cert. No.     | NABL certificate number (if accredited)    | No       |
| Lab Logo           | Upload PNG/JPG — appears on reports        | Yes      |
| Pathologist Signature | Upload PNG (transparent bg) — on reports| Yes      |

### 2.3 Uploading Logo and Signature

1. Click the **Upload** button next to the logo or signature field.
2. Select a PNG or JPG file.
3. The image is uploaded and previewed immediately.
4. Click **Save** to apply changes.

> **Tip:** Use a PNG with a transparent background for the pathologist's digital signature for the best report appearance.

---

## 3. Test Master Management

### 3.1 Access

Navigate to **Settings → Test Master**.

### 3.2 Pre-loaded Tests

LabCore comes pre-loaded with **300+ common Indian pathology tests** covering haematology, biochemistry, microbiology, serology, and more.

### 3.3 Adding a Custom Test

1. Click **+ Add Test**.
2. Fill in:
   - **Test Name** and **Test Code** (unique identifier)
   - **Department** (Haematology, Biochemistry, Microbiology, etc.)
   - **Sample Type** (Blood, Urine, Stool, Swab, etc.)
   - **Tube Type** (EDTA, Plain, Fluoride, Citrate, etc.)
   - **TAT Target** (expected turnaround time in hours)
   - **Price** (default price)
3. Add **parameters** for the test:
   - Parameter name, unit, field type (numeric / qualitative / narrative)
   - Reference ranges (can vary by age and gender)
4. Click **Save**.

### 3.4 Editing a Test

1. Click **Edit** on any test.
2. Modify parameters, reference ranges, pricing, or other fields.
3. Click **Save**. Changes apply to new orders only; existing results are unaffected.

### 3.5 Deactivating a Test

1. Click **Deactivate** on a test.
2. The test will no longer appear in order entry dropdowns.
3. It is not deleted — historical orders and results referencing it are preserved.

### 3.6 Test Panels

Test panels (e.g. "Complete Blood Count", "Full Body Checkup") group multiple component tests. When a panel is selected during order entry, all component tests are automatically included.

To manage panels:
1. Create a test with the **panel** type.
2. Add component tests to the panel.
3. Set a panel price (can differ from the sum of individual component prices).

---

## 4. Rate Card Management

### 4.1 Access

Navigate to **Rate Cards** from the sidebar (Admin only).

### 4.2 Default Rate Card

Every lab has a **default rate card** that contains prices for all tests in the test master.

### 4.3 Creating Additional Rate Cards

1. Click **+ New Rate Card**.
2. Name the rate card (e.g. "Government Panel", "Discounted", "B2B").
3. Set prices for each test — prices can be different from the default rate card.
4. Click **Save**.

### 4.4 Assigning Rate Cards

- Rate cards can be assigned **per order** during order entry.
- Changes to a rate card do not retroactively affect past invoices.

---

## 5. Report Template Configuration

Report templates control the appearance of generated PDF reports.

### 5.1 Elements Controlled

| Element                  | Configured In           |
|--------------------------|------------------------|
| Lab logo                 | Settings → Lab Profile |
| Lab name, address, phone | Settings → Lab Profile |
| Pathologist signature    | Settings → Lab Profile |
| NABL certificate & logo  | Settings → Lab Profile |
| Header colour scheme     | Settings → Lab Profile |

### 5.2 What Appears on Every Report

- Lab logo and letterhead
- Patient demographics (name, age, gender, patient code)
- Test results with reference ranges and abnormal value flags (L, H, C)
- Interpretive comments (if added by pathologist)
- Pathologist's name, qualification, and digital signature
- NABL logo and certificate number (if configured)
- QR code for report verification
- Report generation date and version

---

## 6. Audit Log Monitoring

### 6.1 What Is Logged

All significant actions are automatically logged in the audit trail:

| Category        | Actions Logged                                                  |
|-----------------|----------------------------------------------------------------|
| Patient data    | Create, update, soft-delete patient records                    |
| Orders          | Create, amend, cancel orders                                   |
| Samples         | Collect, receive, reject, dispose                              |
| Results         | Enter, edit, review, authorise, amend                          |
| Reports         | Generate, amend, deliver (with channel and recipient)          |
| Billing         | Create invoice, apply discount, record payment, cancel invoice |
| User management | Create, edit, deactivate, password reset, role change          |
| Authentication  | Login (success/failure), logout, session timeout               |
| Settings        | Any configuration change                                       |

### 6.2 Audit Log Record Fields

Each entry contains: **who** (user ID), **what** (action + entity type), **which record** (entity ID), **old values**, **new values**, **IP address**, **user agent**, and **timestamp** (UTC).

### 6.3 Immutability

Audit logs are **immutable** — they cannot be updated or deleted. This is enforced by a PostgreSQL trigger:

> Attempting to UPDATE or DELETE any row in the `audit_logs` table will raise an error: *"Audit log records cannot be modified or deleted"*.

Audit logs are retained **indefinitely** and can be exported as CSV/JSON for NABL assessor review.

---

## 7. System Health & Monitoring

### 7.1 Health Check Endpoint

| Endpoint                      | Expected Response |
|-------------------------------|-------------------|
| `GET <API_URL>/health`        | HTTP 200          |

Use this to verify that the API is running and connected to the database.

### 7.2 Monitoring Recommendations

| Signal              | Tool              | Alert Threshold                                |
|---------------------|-------------------|-----------------------------------------------|
| Application errors  | Sentry            | New error types or error rate spikes           |
| API latency         | Vercel dashboard   | Serverless function duration > 5s             |
| Failed logins       | Audit logs / Sentry| > 20 from same IP in 10 minutes              |
| Database usage      | Supabase dashboard | Connection count or storage nearing plan limits|

---

## 8. Environment Variables Reference

| Variable              | Where Used     | Purpose                                          |
|-----------------------|----------------|--------------------------------------------------|
| `DATABASE_URL`        | API            | PostgreSQL connection string (pooled)             |
| `DIRECT_URL`          | API / Migrate  | Direct PostgreSQL connection (for migrations)     |
| `JWT_ACCESS_SECRET`   | API            | Signing access tokens (min 32 chars)              |
| `JWT_REFRESH_SECRET`  | API            | Signing refresh tokens                            |
| `NEXT_PUBLIC_API_URL` | Web (Vercel)   | Base URL of the API for browser requests          |

> **Security:** Never commit secrets to version control. Set them as environment variables on your hosting platform (Vercel, Railway, etc.).

---

## 9. Security Configuration

### 9.1 Password Policy

| Setting            | Value                                  |
|--------------------|----------------------------------------|
| Minimum length     | 8 characters                           |
| Complexity         | At least one uppercase letter + one digit|
| Hashing            | bcrypt with cost factor 12             |
| Storage            | Only hash stored; plaintext never persisted|

### 9.2 Session Management

| Setting              | Value                                    |
|----------------------|------------------------------------------|
| Access token         | JWT, 1-hour expiry                       |
| Refresh token        | 7-day TTL, stored server-side            |
| Session timeout      | 8 hours of inactivity (configurable)     |
| Max concurrent sessions | 3 per user                            |
| Force logout         | Admin can revoke any user's session      |

### 9.3 Rate Limiting

| Endpoint       | Limit                         |
|----------------|-------------------------------|
| General API    | 100 requests/minute per IP    |
| Login          | 10 attempts/minute per IP     |

### 9.4 Data Encryption

| Layer          | Method    |
|----------------|----------|
| At rest        | AES-256 (Supabase-managed)  |
| In transit     | TLS 1.3 (HTTPS)             |

---

*For day-to-day user workflows, see the [User Manual](user-manual.md).*
*For deployment, see the [Deployment Guide](deployment-guide.md).*
