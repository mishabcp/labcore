# LabCore LIMS — Release Notes

**Version**: 1.0.0 (MVP) · **Release Date**: February 2026

---

## Highlights

1. **End-to-end lab workflow** — From patient registration to report delivery via WhatsApp, all in one platform.
2. **PDF reports with digital signatures** — Professional, branded PDF reports with pathologist signature, NABL logo, and QR verification.
3. **Billing with GST** — Auto-generated invoices, discount handling, split payments, and daily revenue summaries.
4. **Immutable audit trail** — Every action logged; audit logs cannot be modified or deleted (PostgreSQL trigger-enforced).
5. **Multi-language support** — English and Malayalam UI with instant switching.

---

## Full Feature List

### Patient Registration & Order Entry
- Walk-in and returning patient registration
- Searchable patient lookup (name, mobile, Patient ID)
- Auto-generated Patient ID (format: `LC-YYYYMMDD-NNNN`)
- Test and panel selection with searchable dropdown
- Order priority (Routine, Urgent, STAT)
- Order amendment (add tests) and cancellation with reason codes
- Discount application (percentage or fixed amount, role-based limits)
- Referring doctor linkage

### Sample Management
- Sample tracking through 6 statuses: Ordered → Collected → Received → In Process → Completed → Rejected
- Sample rejection with standardised reason codes
- Sample dashboard with status counts
- Collector and timestamp tracking at every stage

### Result Entry & Authorisation
- Structured result entry form (numeric, qualitative, narrative)
- Auto-flagging of abnormal values (Low/High/Critical) based on age/gender reference ranges
- Keyboard-optimised entry (Tab navigation)
- Multi-level workflow: Entry → Review → Authorisation
- Pathologist rejection with mandatory comments
- Interpretive notes support

### Report Generation & Sharing
- Branded PDF reports with lab logo, letterhead, signature, NABL logo, QR code
- WhatsApp sharing via deep link with pre-filled patient mobile
- Bulk report download (ZIP)
- Report amendment with versioning and reason tracking
- Public report verification via QR code (no login required)

### Billing & Invoicing
- Automatic invoice generation at order creation
- GST-compliant invoices (GSTIN, HSN/SAC code)
- Payment recording (Cash, UPI, Card, Net Banking, Cheque)
- Split payment support
- Daily revenue summary by payment mode
- Invoice status tracking (Paid / Partial / Pending)

### Dashboard & Analytics
- Today's operational summary (patients, orders, reports, revenue)
- Revenue breakdown by payment mode
- Turnaround time (TAT) metrics
- Historical trends (30-day view)

### Settings & Administration
- User management (create, edit, deactivate, password reset)
- Role-based access control (5 roles, enforced at API level)
- Lab profile configuration (name, address, GSTIN, logo, signature, NABL)
- Test master with 300+ pre-loaded Indian pathology tests
- Custom test creation with configurable parameters and reference ranges
- Rate card management (multiple pricing tiers)

### Security & Compliance
- JWT authentication with token refresh
- bcrypt password hashing (cost factor 12)
- Rate limiting (100 req/min general, 10/min login)
- TLS 1.3 encryption in transit
- AES-256 encryption at rest (Supabase-managed)
- Immutable audit logs with PostgreSQL trigger protection

---

## Known Limitations (Planned for Future Phases)

| Feature                           | Status        | Target Phase |
|-----------------------------------|---------------|-------------|
| Two-factor authentication (2FA)   | Not yet       | Phase 2     |
| Offline mode / PWA sync           | Not yet       | Phase 2     |
| Quality control (IQC/EQC)         | Not yet       | Phase 2     |
| Inventory & reagent tracking      | Not yet       | Phase 2     |
| Equipment management / AMC        | Not yet       | Phase 3     |
| ABDM / ABHA ID integration        | Not yet       | Phase 3     |
| FHIR R4 interoperability          | Not yet       | Phase 3     |
| Document management (SOPs)        | Not yet       | Phase 3     |
| CAPA & non-conformance tracking   | Not yet       | Phase 3     |
| Multi-branch support              | Not yet       | Phase 3     |
| Historical trend export (Excel/PDF)| Not yet      | Phase 2     |
| Email report delivery             | Not yet       | Phase 2     |

---

## Browser & Device Support

| Platform           | Minimum Version    |
|--------------------|--------------------|
| Chrome (Desktop)   | Latest 2 versions  |
| Chrome (Android)   | Latest 2 versions  |
| Firefox (Desktop)  | Latest 2 versions  |
| Safari (iOS)       | Latest 2 versions  |
| Edge (Desktop)     | Latest 2 versions  |
| Screen Resolution  | 1024×768 (desktop), 360×640 (mobile) |

---

## Tech Stack

| Component  | Technology                             |
|------------|----------------------------------------|
| Frontend   | Next.js (App Router), Tailwind CSS, TypeScript |
| Backend    | NestJS, Prisma ORM                     |
| Database   | PostgreSQL (Supabase)                  |
| PDF        | Puppeteer (pdf-service package)        |
| Hosting    | Vercel (frontend) + Railway/Render (API) + Supabase (database) |

---

## Upgrade Notes

This section will be updated with migration instructions for future releases.
