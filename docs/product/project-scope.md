# Project Scope Document

**LabCore LIMS** | Product Document | February 2025

---

## Overview

This document defines the scope of LabCore across three development phases and explicitly lists what is out of scope. The phased approach ensures we ship a usable, valuable product quickly (MVP) and expand capabilities based on real customer feedback.

---

## MVP (Phase 1) -- Core Product for Launch

**Goal**: A fully functional LIMS that lets a small lab register patients, collect samples, enter results, generate professional reports, bill patients, and share reports via WhatsApp. Must be usable within 15 minutes of first login.

**Target timeline**: 4--6 months of development

### 1.1 Patient Registration and Order Entry

| Capability | Details |
|-----------|---------|
| Patient registration | Name, age, gender, DOB, mobile number, email, address, unique Patient ID auto-generation |
| Repeat patient lookup | Search by name, mobile, or Patient ID; auto-populate demographics for returning patients |
| Test ordering | Order by individual test, test panel, or test profile; support walk-in and doctor-referred orders |
| Order amendment/cancellation | Edit or cancel orders with tracked reason codes |
| Priority flagging | Mark orders as Routine, Urgent, or STAT |
| Pre-loaded test master | 300+ common Indian pathology tests with reference ranges, sample type, department mapping |
| ABHA ID field | Optional capture field for Ayushman Bharat Health Account ID (integration in Phase 3) |

### 1.2 Barcode/QR Label Generation and Printing

| Capability | Details |
|-----------|---------|
| Auto-generated labels | Barcode or QR code generated at order entry with Patient ID, Sample ID, test name, collection date/time |
| Thermal printer support | Compatible with standard thermal label printers (TSC, Zebra, TVS) |
| Configurable label format | Adjustable fields and layout per sample type |
| Tube type mapping | Visual indicator of tube colour (EDTA purple, plain red, fluoride grey, etc.) |

### 1.3 Sample Collection and Tracking

| Capability | Details |
|-----------|---------|
| Collection workflow | Mark sample as collected with collector name and timestamp |
| Sample status tracking | Real-time status: Ordered, Collected, Received, In Process, Completed, Reported |
| Sample rejection | Reject with reason code (haemolysed, insufficient, wrong tube, clotted, unlabelled); auto-notification to front desk |
| Pending sample dashboard | View all samples pending at each workflow stage |

### 1.4 Manual Result Entry

| Capability | Details |
|-----------|---------|
| Structured entry screens | Per-test entry forms with parameter names, units, and input fields |
| Reference ranges | Age- and gender-specific normal ranges pre-loaded; auto-flagged as Low / Normal / High / Critical |
| Calculated fields | Auto-calculated derived values (e.g., A/G ratio, MCHC, LDL calculated) |
| Result types | Quantitative (numeric), qualitative (Positive/Negative/Reactive), semi-quantitative, narrative (free text for histopathology) |
| Keyboard-optimised entry | Tab through fields, Enter to save, keyboard shortcuts for common actions |

### 1.5 Multi-Level Result Authorisation

| Capability | Details |
|-----------|---------|
| Configurable approval workflow | Technician enters --> Senior Technician reviews --> Pathologist validates and signs |
| Digital signature | Pathologist's uploaded signature applied to the report upon final authorisation |
| Lock after authorisation | Authorised reports are locked; amendments require documented reason and create a new version |
| Role-based access | Only authorised roles can perform each step |

### 1.6 Report Generation (PDF)

| Capability | Details |
|-----------|---------|
| Customisable templates | Lab logo, letterhead, pathologist signature, NABL logo (if applicable), contact details |
| Test-specific formats | Different layouts for CBC (with WBC differential), LFT, KFT, thyroid, urine routine, culture sensitivity, histopathology |
| Reference ranges on report | Printed alongside each result with abnormal flagging |
| QR code on report | Scannable QR for digital verification of report authenticity |
| Report watermark | "Draft" watermark until authorised; "Amended" watermark on corrected reports |
| PDF generation | Clean, professional PDF output suitable for print and digital sharing |
| Report versioning | Amendment history tracked; original versions retained |

### 1.7 WhatsApp Report Sharing

| Capability | Details |
|-----------|---------|
| Download PDF | Download authorised report as a professional PDF |
| One-click WhatsApp share | "Share via WhatsApp" button opens WhatsApp with the patient's number and report download link pre-filled (via wa.me deep link, zero cost) |
| Bulk download | Download multiple authorised reports as PDFs in one action |
| Doctor sharing | Share report with referring doctor via WhatsApp share link |
| Share logging | Log every share event (timestamp, user, channel) for audit trail |

### 1.8 GST-Compliant Billing and Invoicing

| Capability | Details |
|-----------|---------|
| Invoice generation | GST-compliant tax invoice at order entry |
| Rate card management | Configurable rate cards for retail, walk-in, and basic discount structures |
| Payment modes | Cash, UPI, card, net banking -- track payment mode per transaction |
| Partial payments | Support advance payment and balance collection |
| Discount management | Test-level and order-level discounts with configurable limits |
| Daily collection summary | End-of-day report by payment mode |
| Receipt printing | Printable payment receipt with GST details |

### 1.9 Basic Dashboard

| Capability | Details |
|-----------|---------|
| Today's summary | Total patients registered, tests ordered, reports generated, revenue collected |
| Pending work | Samples awaiting collection, results awaiting entry, reports awaiting authorisation |
| Revenue overview | Today, this week, this month -- by payment mode |
| TAT monitor | Average turnaround time per test/department |

### 1.10 User Roles and Access Control

| Role | Permissions |
|------|------------|
| Admin (Lab Owner) | Full access: all features, settings, user management, billing, reports, dashboard |
| Pathologist | Result review, authorisation, report signing; read access to dashboard |
| Senior Technician | Result entry, result review, sample management; cannot authorise |
| Technician | Result entry, sample collection/receiving; cannot review or authorise |
| Front Desk | Patient registration, order entry, billing, payment collection; cannot access results |

### 1.11 Audit Trail

| Capability | Details |
|-----------|---------|
| Immutable log | Every create, update, and delete action logged with user ID, timestamp, old value, new value |
| Result audit | Full history of every result entry, edit, and authorisation |
| Report audit | Version history for all reports including amendments |
| Login/logout tracking | User session log with IP and device info |
| Export | Audit log exportable for NABL assessor review |

### 1.12 Language Support

| Capability | Details |
|-----------|---------|
| UI language toggle | Switch between Malayalam and English per user preference |
| Report language | Malayalam patient name, section headers, and interpretive notes; test parameters in English (medical standard) |
| Localisation framework | Built with i18n support for adding more languages later (Tamil, Hindi, Kannada) |

---

## Phase 2 -- Growth Features

**Goal**: Expand capabilities for growing labs -- analyser interfacing, quality control, multi-branch, B2B operations, and external portals.

**Target timeline**: 3--6 months after MVP launch

### 2.1 Instrument/Analyser Interfacing

- Bidirectional interface with common Indian analysers (Sysmex, Mindray, Roche, Erba, Agappe)
- Protocol support: RS-232 serial, LAN/TCP, ASTM, HL7
- Worklist push: send pending tests from LIMS to analyser
- Result pull: auto-receive results from analyser into LIMS, mapped to correct patient/test
- Result validation before auto-population (QC check)
- Support for middleware integration where direct interfacing is not possible

### 2.2 Internal Quality Control (IQC)

- Daily QC result entry for control materials
- Westgard multi-rule violation checking (1-2s, 1-3s, 2-2s, R-4s, 4-1s, 10x)
- Levey-Jennings chart visualisation for trend monitoring
- QC failure blocks patient result release until resolved
- Electronic QC log: date, control lot, result, rule violated, corrective action, reviewer
- Mean, SD, and CV calculation

### 2.3 Delta Check

- Compare current result against patient's previous result (configurable look-back period)
- Configurable delta limits per parameter
- Flag results exceeding delta for pathologist review before release

### 2.4 Critical Value Management

- Pre-configured panic value thresholds per parameter
- Auto-alert to lab staff on critical result entry
- Mandatory clinical notification documentation (who was called, when, clinician response)

### 2.5 B2B and Corporate Billing

- Dedicated rate cards per corporate/insurance/government account
- Credit billing with configurable credit limits and payment terms
- Monthly consolidated invoicing
- Outstanding dues and ageing reports
- Referral doctor commission calculation and payout reports

### 2.6 Patient Portal

- OTP-secured login for patients
- View and download current and historical reports
- Real-time order status tracking
- Family account management (one login, multiple members)

### 2.7 Doctor/Referral Portal

- Dedicated login for referring doctors
- Real-time visibility of referred patients' order and report status
- Direct report download
- Monthly commission statement access

### 2.8 Home Collection Mobile Workflow

- Mobile-friendly interface for phlebotomists
- Assignment management: view assigned collections, patient location, contact
- Barcode scanning for sample confirmation
- Sample condition flagging on receipt
- GPS tracking of collection route (optional)

### 2.9 Inventory and Reagent Management

- Reagent and consumable master with lot number and expiry tracking
- Stock movement tracking: receipts, issues, returns, wastage, write-offs
- Minimum reorder level alerts
- FIFO consumption enforcement
- Cost-per-test calculation based on reagent consumption

### 2.10 Multi-Branch Support

- Centralised patient master across branches
- Branch-wise dashboards and reporting
- Centralised test master, rate card, and report template management
- Sample tracking across collection centres and processing labs
- Branch-level user access control

---

## Phase 3 -- Advanced Features

**Goal**: Add compliance integrations, AI capabilities, and advanced quality management for labs pursuing accreditation and operational excellence.

**Target timeline**: 6--12 months after Phase 2

### 3.1 ABDM/ABHA Integration

- ABHA ID verification at patient registration via ABDM APIs
- Consent-based health record sharing to national PHR ecosystem
- FHIR R4 DiagnosticReport resource generation and submission
- HIP (Health Information Provider) role compliance
- Health Facility Registry (HFR) registration support

### 3.2 AI-Assisted Reporting

- Auto-generated interpretive comments for common panels (lipid profile, thyroid, LFT, KFT)
- AI-assisted CBC interpretation with clinical comment suggestions
- Anomaly detection flagging unusual result patterns
- AI-driven TRF scanning: photograph a handwritten prescription, auto-populate order entry (OCR + NLP)

### 3.3 EQA/Proficiency Testing Tracking

- Record PT results from programmes (CMC Vellore, EQAS, UK NEQAS, RIQAS)
- Historical performance tracking per test across rounds
- Corrective action documentation for underperforming parameters

### 3.4 NABL Documentation Module

- Controlled document/SOP repository with version control and review date alerts
- CAPA (Corrective and Preventive Action) tracking
- Non-conformance and incident reporting
- Internal audit scheduling and tracking
- Equipment calibration and maintenance log with due date alerts
- Staff competency and training record management
- Complaint management with root cause analysis

### 3.5 Advanced Analytics and Business Intelligence

- Referral doctor-wise revenue and test volume analysis
- Department-wise profitability reports
- Technician productivity metrics
- Revenue forecasting based on historical trends
- Test demand seasonality analysis (monsoon panels, festival season health checks)
- Exportable MIS reports for management and accountants

### 3.6 Integration Ecosystem

- Tally ERP / Zoho Books accounting integration
- Payment gateway integration (Razorpay, PayU) for online billing
- Email delivery (Resend) for report distribution
- API for third-party integrations

---

## Out of Scope (Not Building)

The following are explicitly excluded from LabCore's product roadmap:

| Excluded Capability | Reason |
|--------------------|--------|
| Radiology PACS integration | Specialised domain; not relevant for 95% of small pathology labs |
| Full ERP / accounting system | We provide lab billing, not general ledger accounting; integrate with Tally/Zoho instead |
| Hospital Information System (HIS) | LabCore is a standalone LIMS, not a hospital management system |
| EMR / Electronic Medical Records | Patient medical records beyond lab results are not in scope |
| Pharmacy management | Not relevant to diagnostic labs |
| Telemedicine / video consultation | Outside the lab workflow domain |
| Biobanking / genomics workflows | Research LIMS territory, not clinical pathology |
| White-label franchise platform | We serve independent labs, not lab franchise networks |
| On-premise deployment | Cloud-only with offline PWA; we do not ship installable server software |

---

## Phase Dependency Map

```
Phase 1 (MVP)                    Phase 2 (Growth)              Phase 3 (Advanced)
─────────────                    ────────────────              ──────────────────
Patient Registration ──────────> Multi-Branch Support ───────> ABDM Integration
Billing ───────────────────────> B2B/Corporate Billing ──────> Tally/Zoho Integration
Result Entry ──────────────────> Analyser Interfacing ───────> AI-Assisted Reporting
Report Generation ─────────────> Patient/Doctor Portals ─────> Advanced Analytics
WhatsApp Sharing               > Home Collection App
Audit Trail ───────────────────> IQC/Delta Check/Critical ──> EQA Tracking
                                > Inventory Management ──────> NABL Documentation Module
```

Each phase builds on the previous. Phase 2 features require a stable Phase 1 foundation. Phase 3 features require Phase 2 infrastructure (e.g., AI reporting requires analyser-interfaced result data; NABL module requires QC infrastructure).
