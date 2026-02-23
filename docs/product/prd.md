# Product Requirements Document (PRD)

**LabCore LIMS** | Product Document | February 2025

---

## 1. Overview

This PRD specifies the detailed requirements for LabCore MVP (Phase 1). Each feature module includes user stories with acceptance criteria and priority classification.

### Priority Levels

| Priority | Label | Meaning |
|----------|-------|---------|
| P0 | Must-have for MVP | Launch-blocking. The product cannot ship without this. |
| P1 | Important, soon after | Not required for initial launch but should follow within 4--8 weeks. |
| P2 | Nice-to-have | Enhances the product but not critical for early adoption. |

---

## 2. Module 1: Patient Registration and Order Entry

### 2.1 User Stories

**US-1.1: Register a new walk-in patient** (P0)
> As a front desk staff member, I want to register a new patient with their demographics and ordered tests so that the lab can begin processing their samples.

Acceptance Criteria:
- Form captures: full name, age (or DOB with auto-calculated age), gender, mobile number (mandatory), email (optional), address (optional)
- Unique Patient ID auto-generated (format: LC-YYYYMMDD-NNNN)
- At least one test must be selected before the order can be submitted
- Test selection via searchable dropdown with auto-complete (search by test name or test code)
- Submitting the form creates the order and navigates to the billing screen
- Entire registration + ordering takes under 2 minutes

**US-1.2: Register a returning patient** (P0)
> As a front desk staff member, I want to search for an existing patient by name, mobile number, or Patient ID so that I don't re-enter their demographics.

Acceptance Criteria:
- Search bar on the registration screen; results appear as-you-type (debounced, 300ms)
- Matching patients displayed with name, age, gender, mobile, and last visit date
- Selecting a patient auto-fills all demographics; user can edit if needed
- New test order created under the existing patient record

**US-1.3: Order test panels and profiles** (P0)
> As a front desk staff member, I want to order a pre-defined test panel (e.g., "Full Body Checkup") that automatically includes all component tests.

Acceptance Criteria:
- Test panels defined in the test master (e.g., "Complete Blood Count" includes 20+ parameters)
- Selecting a panel auto-adds all component tests
- Individual tests can be added/removed from the order after panel selection
- Panel pricing can differ from the sum of individual test prices

**US-1.4: Order amendment and cancellation** (P1)
> As a front desk staff member, I want to add tests to or cancel tests from an existing order before results are entered.

Acceptance Criteria:
- Tests can be added to an open order at any time before results are entered for those tests
- Tests can be cancelled only if no results have been entered; cancellation requires a reason code
- Billing adjusts automatically upon amendment or cancellation
- Amendment and cancellation logged in the audit trail

**US-1.5: Priority flagging** (P1)
> As a front desk staff member, I want to mark an order as Urgent or STAT so that the lab prioritises it.

Acceptance Criteria:
- Priority options: Routine (default), Urgent, STAT
- Urgent/STAT orders visually highlighted in the worklist (colour coding)
- Priority change logged in audit trail

---

## 3. Module 2: Barcode/QR Label Generation

### 3.1 User Stories

**US-2.1: Generate and print sample labels** (P0)
> As a front desk staff member, I want barcode labels printed automatically when an order is created so that each sample tube is uniquely identified.

Acceptance Criteria:
- Labels generated immediately upon order submission
- Each label contains: barcode (encoding Sample ID), Patient ID, patient name, test name(s), collection date/time, tube type/colour indicator
- Print command sent to configured thermal printer
- Multiple labels printed if order requires multiple sample types (e.g., EDTA + plain)
- Label format configurable in settings (fields, size, orientation)

**US-2.2: Reprint labels** (P2)
> As a front desk staff member, I want to reprint labels for an existing order in case of label damage or loss.

Acceptance Criteria:
- Reprint option available from the order detail screen
- Reprint logged in audit trail

---

## 4. Module 3: Sample Collection and Tracking

### 4.1 User Stories

**US-3.1: Mark sample as collected** (P0)
> As a technician/phlebotomist, I want to mark a sample as collected and record who collected it so that the sample's chain of custody begins.

Acceptance Criteria:
- Scan barcode or search by Patient ID / Sample ID to pull up the order
- Click "Collect" button; system records collector name (logged-in user) and timestamp
- Sample status changes from "Ordered" to "Collected"

**US-3.2: Receive sample at the lab** (P0)
> As a lab technician, I want to confirm receipt of a sample at the lab and verify its condition.

Acceptance Criteria:
- Scan barcode to pull up sample details
- Confirm receipt: sample status changes from "Collected" to "Received"
- Option to flag sample condition issues (haemolysed, clotted, insufficient volume)

**US-3.3: Reject a sample** (P0)
> As a lab technician, I want to reject an unsuitable sample with a documented reason so that the rejection is traceable and a recollection can be initiated.

Acceptance Criteria:
- Rejection requires selecting a reason code from a pre-defined list (haemolysed, insufficient volume, wrong tube type, clotted, unlabelled, beyond stability window, other)
- Rejection recorded with user ID, timestamp, and reason
- Front desk notified of the rejection
- Sample status changes to "Rejected"
- Rejection appears in the audit trail and rejection log

**US-3.4: View pending samples dashboard** (P0)
> As a lab supervisor, I want to see all samples at each workflow stage so that I can identify bottlenecks.

Acceptance Criteria:
- Dashboard view showing counts and lists per status: Ordered, Collected, Received, In Process, Completed, Reported, Rejected
- Filterable by date, department, priority
- Clickable: clicking a status shows the list of samples in that state

---

## 5. Module 4: Result Entry

### 5.1 User Stories

**US-4.1: Enter results for a test** (P0)
> As a lab technician, I want to enter test results for a patient's sample using a structured form so that results are accurate and standardised.

Acceptance Criteria:
- Scan barcode or search to pull up pending tests for a sample
- Structured form displays: parameter name, unit, input field, reference range, flag column
- Numeric fields validate input type (reject non-numeric for quantitative parameters)
- Calculated fields auto-compute (e.g., A/G ratio = Albumin / Globulin)
- Out-of-range values auto-flagged as Low (L), High (H), or Critical (C) based on age/gender-specific reference ranges
- Tab key moves between fields for fast keyboard entry
- Save button stores results; status changes to "Completed"

**US-4.2: Enter qualitative results** (P0)
> As a lab technician, I want to select qualitative results from a dropdown so that results are standardised.

Acceptance Criteria:
- Qualitative tests present options: Positive / Negative, Reactive / Non-Reactive, Present / Absent, or custom coded values
- Dropdown selection (not free text) ensures consistency
- Free-text comment field available for additional observations

**US-4.3: Enter narrative/free-text results** (P0)
> As a pathologist, I want to enter free-text findings for histopathology, cytology, or other descriptive reports.

Acceptance Criteria:
- Rich text editor for Gross Description, Microscopic Description, and Diagnosis fields
- Template text can be pre-loaded and edited (e.g., common histopathology templates)
- Image attachment supported (microscopy images) -- stored and displayed in the report

**US-4.4: Edit results before authorisation** (P1)
> As a lab technician, I want to edit previously entered results if I made an error, before the results are authorised.

Acceptance Criteria:
- Results can be edited while status is "Completed" (not yet authorised)
- Edit is logged in audit trail with old value, new value, user ID, timestamp, and reason
- Once authorised, results cannot be edited through this workflow (amendment process required)

---

## 6. Module 5: Result Authorisation

### 6.1 User Stories

**US-5.1: Review and authorise results** (P0)
> As a pathologist, I want to review entered results alongside reference ranges and the patient's previous results so that I can validate accuracy before signing.

Acceptance Criteria:
- Authorisation screen shows: patient demographics, current results with reference ranges and flags, previous results (if any) for comparison
- Pathologist can add interpretive comments before authorisation
- "Authorise" button applies digital signature, locks the results, and changes status to "Authorised"
- Authorisation logged with user ID and timestamp

**US-5.2: Reject results back to technician** (P0)
> As a pathologist, I want to send results back to the technician for re-entry if I suspect an error.

Acceptance Criteria:
- "Reject" button with mandatory comment field explaining the reason
- Status reverts to "In Process"; technician sees the rejection reason
- Rejection logged in audit trail

**US-5.3: Amend an authorised report** (P1)
> As a pathologist, I want to amend a previously authorised report if a correction is needed.

Acceptance Criteria:
- Amendment requires a documented reason
- Creates a new version of the report; original version retained in history
- Amended report carries an "Amended Report" watermark
- Amendment logged with old value, new value, reason, and authorising user
- Re-sent to patient/doctor with amendment notification

---

## 7. Module 6: Report Generation

### 7.1 User Stories

**US-6.1: Generate a formatted PDF report** (P0)
> As a pathologist, upon authorising results I want the system to generate a professional PDF report with my lab's branding so that it can be shared with the patient.

Acceptance Criteria:
- PDF includes: lab logo, letterhead, lab contact details, patient demographics, test results with reference ranges, abnormal value flags, interpretive comments, pathologist's digital signature, NABL logo (if configured), QR code for report verification
- Report layout is clean, professional, and readable on both screen and print
- PDF file size under 500 KB for easy WhatsApp sharing
- Generated within 3 seconds of authorisation

**US-6.2: Configure report templates** (P0)
> As a lab admin, I want to customise report templates with my lab's branding and preferred layout.

Acceptance Criteria:
- Upload lab logo (PNG/JPG, auto-resized)
- Upload pathologist digital signature (PNG with transparent background)
- Configure lab name, address, phone, email, NABL certificate number
- Choose header colour scheme
- Preview template before saving
- Different templates configurable per test type (optional, P2)

**US-6.3: Print a report** (P1)
> As a front desk staff member, I want to print a physical copy of the report for patients who request it.

Acceptance Criteria:
- Print button on the report view screen
- Opens browser print dialog with the report PDF
- Prints on A4 paper in portrait orientation

---

## 8. Module 7: WhatsApp Report Sharing

### 8.1 User Stories

**US-7.1: Share report via WhatsApp** (P0)
> As a front desk staff member, I want to share the authorised report to the patient's WhatsApp with one click so that I don't have to manually photograph or type the report.

Acceptance Criteria:
- "Download PDF" button visible on the report screen after authorisation; downloads the report PDF to the device
- "Share via WhatsApp" button visible next to it; clicking it opens WhatsApp (via `wa.me` deep link) with the patient's registered mobile number pre-filled and a message containing the report download link
- Message text: "Dear [Patient Name], your lab report from [Lab Name] is ready. Download your report: [PDF link]"
- PDF download link is a presigned URL valid for 24 hours
- Share event logged in the system (timestamp, user, channel) for audit purposes
- Works on both desktop (opens WhatsApp Web) and mobile (opens WhatsApp app)

**US-7.2: Bulk download reports** (P1)
> As a front desk staff member, I want to download multiple authorised reports at once so that I can share them quickly.

Acceptance Criteria:
- Checkbox selection on the authorised reports list
- "Download Selected" button downloads all selected reports as individual PDFs (or a single ZIP file if more than 3)
- "Share All via WhatsApp" button opens WhatsApp share links sequentially for each selected report
- Progress indicator shows which reports have been shared

**US-7.3: Share report with referring doctor** (P1)
> As a front desk staff member, I want to share a report with the referring doctor via WhatsApp so that they receive results promptly.

Acceptance Criteria:
- If a referring doctor is linked to the order, a "Share with Doctor" button appears on the report screen
- Clicking it opens a WhatsApp share link pre-filled with the doctor's mobile number and the report download link
- Share event logged in the system

---

## 9. Module 8: Billing and Invoicing

### 9.1 User Stories

**US-8.1: Generate an invoice at order entry** (P0)
> As a front desk staff member, I want an invoice generated automatically when I submit an order so that the patient can pay immediately.

Acceptance Criteria:
- Invoice displays: patient name, ordered tests, individual prices, subtotal, applicable discount, GST (18%), grand total
- Invoice number auto-generated (format: INV-YYYYMMDD-NNNN)
- GST-compliant format with lab's GSTIN, HSN/SAC code
- Printable and downloadable as PDF

**US-8.2: Apply discounts** (P0)
> As a front desk staff member, I want to apply a discount to an order based on lab policy.

Acceptance Criteria:
- Discount can be applied as percentage or fixed amount
- Discount applied at order level or individual test level
- Maximum discount limit configurable per user role (e.g., front desk can give up to 10%, admin up to 50%)
- Discount reason recorded
- Discount appears on the invoice

**US-8.3: Record payment** (P0)
> As a front desk staff member, I want to record the payment mode and amount received so that billing is tracked accurately.

Acceptance Criteria:
- Payment modes: Cash, UPI, Card, Net Banking, Cheque
- Split payment supported (e.g., part cash, part UPI)
- Payment receipt generated with transaction details
- Outstanding balance tracked for partial payments
- Daily collection summary available per payment mode

**US-8.4: Manage rate cards** (P1)
> As a lab admin, I want to configure test prices in a rate card so that billing is consistent.

Acceptance Criteria:
- Default rate card with prices for all tests in the test master
- Ability to create multiple rate cards (e.g., retail, discounted, government)
- Assign rate card per order or per patient category
- Rate card changes do not affect past invoices

---

## 10. Module 9: Dashboard

### 10.1 User Stories

**US-9.1: View today's operational summary** (P0)
> As a lab owner, I want to see a dashboard with today's key metrics when I log in.

Acceptance Criteria:
- Cards showing: patients registered today, tests ordered, reports generated, reports delivered
- Pending work: samples awaiting results, results awaiting authorisation
- Revenue collected today (total and by payment mode)
- Loads within 2 seconds

**US-9.2: View TAT metrics** (P1)
> As a lab owner, I want to see average turnaround time per test type so that I can identify slow areas.

Acceptance Criteria:
- Average TAT calculated from order creation to report authorisation
- Breakdown by department and test type
- Visual indicator (green/yellow/red) based on configurable TAT targets

**US-9.3: View historical trends** (P2)
> As a lab owner, I want to see weekly and monthly trends in test volume and revenue.

Acceptance Criteria:
- Line/bar charts for daily test volume and revenue over the past 30 days
- Filterable by date range, department, test type
- Export to Excel/PDF

---

## 11. Module 10: Settings and Configuration

### 11.1 User Stories

**US-10.1: Manage users** (P0)
> As a lab admin, I want to create, edit, and deactivate user accounts with assigned roles.

Acceptance Criteria:
- Create user: name, email/mobile, role (Admin, Pathologist, Senior Technician, Technician, Front Desk), password
- Edit user: change role, reset password, update details
- Deactivate user: disable login without deleting the account (audit trail references preserved)
- Max users limited by subscription plan

**US-10.2: Manage test master** (P0)
> As a lab admin, I want to add, edit, or deactivate tests in the test master.

Acceptance Criteria:
- Pre-loaded with 300+ common Indian pathology tests
- Each test definition: test name, test code, department, sample type, tube type, parameters (with name, unit, reference ranges by age/gender), TAT target, price
- Add custom tests with custom parameters
- Edit reference ranges
- Deactivate tests that the lab does not offer (hidden from order entry, not deleted)

**US-10.3: Configure lab profile** (P0)
> As a lab admin, I want to set up my lab's details for billing and reports.

Acceptance Criteria:
- Lab name, address, phone, email, website
- GSTIN and HSN/SAC code for invoicing
- Lab logo upload
- Pathologist name(s) and digital signature upload
- NABL certificate number and logo (if applicable)

**US-10.4: Language preference** (P0)
> As any user, I want to switch the UI language between English and Malayalam.

Acceptance Criteria:
- Language toggle in the user profile / settings
- Switching language refreshes the UI immediately
- Language preference saved per user account

---

## 12. Non-Functional Requirements

### 12.1 Performance

| Metric | Target |
|--------|--------|
| Page load time | < 2 seconds on 4G connection |
| Report PDF generation | < 3 seconds |
| Search results (patient lookup) | < 500ms |
| Dashboard load | < 2 seconds |
| Concurrent users per lab | Support at least 10 simultaneous users |

### 12.2 Offline Behaviour

| Scenario | Expected Behaviour |
|----------|-------------------|
| Internet goes down during registration | Registration completes locally; syncs when online |
| Internet goes down during result entry | Results saved locally; syncs when online |
| Internet goes down during report generation | Report generated locally as PDF; WhatsApp delivery queued |
| User logs in while offline | Login succeeds using cached credentials (previously authenticated) |
| Two users edit the same record offline | Last-write-wins with conflict log; admin notified |

### 12.3 Data Limits

| Resource | Limit |
|----------|-------|
| Patient records per lab | Unlimited |
| Test definitions per lab | Up to 2,000 |
| Report storage | Retained for 7 years minimum (configurable) |
| Audit log retention | Indefinite (append-only, never deleted) |
| File attachments per report | Up to 5 images, 2 MB each |

### 12.4 Security

| Requirement | Implementation |
|-------------|---------------|
| Authentication | Email/mobile + password; OTP-based login option |
| Session management | JWT tokens; configurable session timeout (default 8 hours) |
| Password policy | Minimum 8 characters, at least one uppercase, one number |
| Data encryption at rest | AES-256 |
| Data encryption in transit | TLS 1.3 |
| Role-based access | Enforced at API level, not just UI |

### 12.5 Accessibility

| Requirement | Standard |
|-------------|----------|
| Colour contrast | WCAG 2.1 AA (minimum 4.5:1 for text) |
| Font size | Minimum 14px base; user-adjustable |
| Keyboard navigation | All core workflows completable via keyboard |
| Screen reader | Semantic HTML with ARIA labels on interactive elements |

### 12.6 Browser and Device Support

| Platform | Minimum Version |
|----------|----------------|
| Chrome (desktop) | Latest 2 versions |
| Chrome (Android) | Latest 2 versions |
| Firefox (desktop) | Latest 2 versions |
| Safari (iOS) | Latest 2 versions |
| Edge (desktop) | Latest 2 versions |
| Screen resolution | Minimum 1024x768 (desktop); 360x640 (mobile) |
