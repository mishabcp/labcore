# LabCore LIMS — User Manual

**Version**: 1.0 · **Last Updated**: February 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Patient Registration](#3-patient-registration)
4. [Order Entry](#4-order-entry)
5. [Sample Management](#5-sample-management)
6. [Result Entry](#6-result-entry)
7. [Result Authorisation](#7-result-authorisation)
8. [Reports](#8-reports)
9. [Invoices & Billing](#9-invoices--billing)
10. [Settings (Admin Only)](#10-settings-admin-only)
11. [Language & Preferences](#11-language--preferences)

---

## 1. Getting Started

### 1.1 Logging In

1. Open LabCore in your browser (e.g. `https://your-lab.labcore.app` or `http://localhost:3000` for local).
2. Enter your **mobile number** and **password**.
3. Click **Sign in**. You will be redirected to the Dashboard.

> **First-time demo login**: Mobile `9876543210`, Password `demo123` (available if the database was seeded).

If you do not have an account, contact your lab admin. Lab owners can register a new lab by clicking **"register a lab"** on the login page.

### 1.2 Navigation

After logging in, you will see a **left-side navigation panel** with the following menu items:

| Menu Item     | Who Sees It     | Purpose                                  |
|---------------|-----------------|------------------------------------------|
| Dashboard     | All users        | Today's operational summary              |
| Patients      | All users        | Register and manage patients             |
| Orders        | All users        | Create and manage lab orders             |
| Samples       | All users        | Track sample collection and receipt      |
| Results       | All users        | Enter and review test results            |
| Reports       | All users        | Generated PDF reports                    |
| Rate Cards    | Admin only       | Manage test pricing                      |
| Settings      | Admin only       | Users, Lab Profile, Test Master          |

The **header bar** shows your name, lab name, and a **language toggle** (English / Malayalam).

### 1.3 Logging Out

Click the **Logout** button at the bottom of the left navigation panel. This clears your session and returns you to the login page.

---

## 2. Dashboard

The dashboard is the home screen after login. It displays today's key metrics at a glance:

| Metric                     | Description                                         |
|----------------------------|-----------------------------------------------------|
| Patients Registered Today  | Number of patients registered today                 |
| Tests Ordered              | Number of tests ordered today                       |
| Reports Generated          | Number of reports generated today                   |
| Reports Delivered          | Number of reports shared/delivered today             |
| Pending Authorisation      | Results awaiting pathologist review                 |
| Pending Samples            | Samples that have not yet been received/processed   |
| Average TAT                | Average turnaround time (hours) from order to report|
| Today's Revenue            | Total revenue collected today                       |
| This Week / Month Revenue  | Cumulative revenue for the current week and month   |
| Revenue by Payment Mode    | Breakdown by Cash, UPI, Card, etc.                  |

Click any metric card to navigate to the related module for more detail.

---

## 3. Patient Registration

### 3.1 Registering a New Patient

1. Navigate to **Patients** from the sidebar.
2. Click **+ New Patient**.
3. Fill in the patient details:
   - **Name** (required)
   - **Age** or **Date of Birth** (age auto-calculates if DOB is provided)
   - **Gender** (required)
   - **Mobile Number** (required)
   - **Email** (optional)
   - **Address** (optional)
4. Click **Save**. A unique **Patient ID** is auto-generated (format: `LC-YYYYMMDD-NNNN`).

### 3.2 Finding a Returning Patient

1. On the **Patients** page, use the **search bar** at the top.
2. Search by **name**, **mobile number**, or **Patient ID**.
3. Results appear as you type (debounced search).
4. Click on a patient to view their profile or create a new order.

### 3.3 Editing Patient Details

1. Open the patient's profile by clicking their name in the patient list.
2. Edit any field and click **Save**.

---

## 4. Order Entry

### 4.1 Creating a New Order

1. Navigate to **Orders** → **+ New Order**.
2. **Select a patient**: Search for an existing patient or create a new one. If coming from a patient's profile page, the patient is pre-selected.
3. **Select tests**: Use the searchable test dropdown to find tests by name or code. You can:
   - Add individual tests one at a time.
   - Select a **test panel** (e.g. "Complete Blood Count") which auto-adds all component tests.
   - Remove individual tests by clicking the **×** next to each selected test.
4. **Set priority** (optional): Routine (default), Urgent, or STAT.
5. **Apply discount** (optional): Enter a percentage or fixed amount discount.
6. **Select referring doctor** (optional): Link a referring doctor to the order.
7. Click **Submit Order**.

After submission:
- An **invoice** is generated automatically.
- **Samples** are created based on the ordered tests and their required tube types.
- You are taken to the order detail page.

### 4.2 Viewing Orders

The **Orders** list page shows all orders with columns for:
- Order Code, Patient Name, Date, Test Count, Priority, Status

Click any order to view its full details, samples, results, and invoice.

---

## 5. Sample Management

### 5.1 Sample Dashboard

Navigate to **Samples** to see all samples grouped by their current status. Samples move through these statuses:

| Status      | Meaning                                            |
|-------------|---------------------------------------------------|
| Ordered     | Sample has been requested but not yet collected    |
| Collected   | Sample has been drawn/collected from the patient   |
| Received    | Sample received at the laboratory                  |
| In Process  | Testing is in progress                             |
| Completed   | Results have been entered                          |
| Rejected    | Sample was rejected (reason documented)            |

### 5.2 Updating Sample Status

1. Find the sample in the list (filter by status using the status tabs at the top).
2. Use the **status dropdown** next to each sample to move it to the next stage:
   - **Ordered → Collected**: Marks the sample as collected; records the collector and timestamp.
   - **Collected → Received**: Confirms receipt at the lab.
   - **Received → In Process**: Marks testing as started.
3. The system records the logged-in user and timestamp for each status change.

### 5.3 Rejecting a Sample

1. Select **Rejected** from the status dropdown.
2. A prompt appears asking you to select a **rejection reason** from:
   - Hemolyzed
   - Clotted
   - Insufficient Quantity (QNS)
   - Wrong Container / Tube Type
   - Mislabeled / Unlabeled
   - Leaked / Damaged in Transit
   - Improper Transport Temperature
   - Other
3. Enter an optional comment and confirm. The rejection is logged in the audit trail.

---

## 6. Result Entry

### 6.1 Results Worklist

Navigate to **Results** to see the results worklist. Use the **status filter** at the top to view:

| Filter      | Shows                                  |
|-------------|---------------------------------------|
| Pending     | Tests awaiting result entry            |
| Entered     | Results entered, not yet reviewed      |
| Reviewed    | Results reviewed, awaiting authorisation|
| Authorised  | Fully authorised results               |

Each row shows the **Patient Name**, **Test Name**, **Priority** (Routine / Urgent / STAT), **Status**, and an **Action** link.

### 6.2 Entering Results

1. Click **Enter / View** on a pending result.
2. The result entry form displays each test parameter with:
   - **Parameter name** and **unit**
   - **Input field** for the value
   - **Reference range** for comparison
   - **Flag** column (auto-populated: L = Low, H = High, C = Critical)
3. Enter values for each parameter. Use the **Tab** key to move quickly between fields.
4. Out-of-range values are automatically flagged based on the patient's age and gender.
5. For **qualitative tests**, select from a dropdown (Positive / Negative, Reactive / Non-Reactive, etc.).
6. For **narrative/free-text results** (e.g. histopathology), use the text editor.
7. Click **Save** to store the results. The result status changes to **Entered**.

### 6.3 Editing Results Before Authorisation

Results can be edited while in **Entered** or **Reviewed** status. Once **Authorised**, results are locked and require a formal amendment process.

---

## 7. Result Authorisation

### 7.1 Reviewing and Authorising

1. Navigate to **Results** → filter by **Entered** or **Reviewed** status.
2. Click on a result to open the review screen.
3. Review the entered values against reference ranges and any auto-generated flags.
4. Add **interpretive comments** if needed.
5. Click **Authorise** to:
   - Lock the results (no further edits without formal amendment).
   - Generate a **PDF report** automatically.
   - Record the authorising pathologist and timestamp.

### 7.2 Rejecting Results Back to Technician

If you suspect an error in the entered results:
1. Click **Reject** on the review screen.
2. Enter a mandatory comment explaining the reason.
3. The result status reverts and the technician sees the rejection reason.

---

## 8. Reports

### 8.1 Viewing Reports

Navigate to **Reports** to see all generated reports. Each row shows:
- **Report Code** and **Version**
- **Patient Name** and **Order Code**
- **Date** generated
- Action buttons

### 8.2 Downloading a Report

Click the **Download** button next to any report to download the PDF to your device. The PDF includes:
- Lab logo and letterhead
- Patient demographics
- Test results with reference ranges and abnormal flags
- Interpretive comments
- Pathologist's digital signature
- QR code for report verification

### 8.3 Sharing via WhatsApp

Click the **Share via WhatsApp** button to open WhatsApp (or WhatsApp Web) with:
- The patient's mobile number pre-filled.
- A message containing the report download link.

The share link is valid for 24 hours. The share event is logged for audit purposes.

### 8.4 Bulk Download

1. Use the **checkboxes** next to individual reports to select multiple.
2. Use the **Select All** checkbox in the header to toggle all.
3. Click **Download Selected** to download all selected reports.

---

## 9. Invoices & Billing

### 9.1 Viewing Invoices

Navigate to **Invoices & Billing** to see all invoices. The table shows:

| Column   | Description                                       |
|----------|---------------------------------------------------|
| Patient  | Patient name and order code                       |
| Date     | Invoice issue date                                |
| Amount   | Grand total (including GST)                       |
| Due      | Outstanding balance                               |
| Status   | **PAID** (green), **PARTIAL** (yellow), or **PENDING** (red) |
| Action   | Click **View Details** to open the full invoice   |

### 9.2 Invoice Details

The invoice detail page shows:
- **Patient name** and demographics
- **Ordered tests** with individual prices
- **Subtotal**, **Discount**, **GST (18%)**, and **Grand Total**
- **Payment history**: Each payment recorded with mode (Cash, UPI, Card, Net Banking, Cheque) and timestamp
- Option to **record a new payment** (supports split payments)
- **Print** or **Download PDF** button for a GST-compliant invoice

### 9.3 Recording a Payment

1. Open an invoice with a pending balance.
2. Click **Record Payment**.
3. Select the **payment mode** (Cash, UPI, Card, Net Banking, Cheque).
4. Enter the **amount** received.
5. Click **Save**. The invoice status updates automatically (Paid / Partial).

---

## 10. Settings (Admin Only)

> These sections are visible only to users with the **Admin** role.

### 10.1 User Management

Navigate to **Settings → Users** to manage lab staff accounts.

- **Add User**: Name, mobile, role (Admin / Pathologist / Senior Technician / Technician / Front Desk), password.
- **Edit User**: Change role, reset password, update details.
- **Deactivate User**: Disables login without deleting the account (preserves audit trail references).

### 10.2 Lab Profile

Navigate to **Settings → Lab Profile** to configure your lab's details:

- Lab name, address, phone, email, website
- GSTIN and HSN/SAC code (for invoicing)
- Lab logo upload (PNG/JPG)
- Pathologist name(s) and digital signature upload
- NABL certificate number and logo (if applicable)

### 10.3 Test Master

Navigate to **Settings → Test Master** to manage the lab's test catalogue:

- **View all tests**: Pre-loaded with 300+ common Indian pathology tests.
- **Add a custom test**: Define test name, code, department, sample type, tube type, parameters (with reference ranges by age/gender), TAT target, and price.
- **Edit a test**: Modify reference ranges, parameters, pricing.
- **Deactivate a test**: Hides the test from order entry without deleting it.

### 10.4 Rate Cards

Navigate to **Rate Cards** to manage test pricing:

- **Default rate card** with prices for all tests.
- Create **multiple rate cards** (e.g. retail, discounted, government).
- Assign a rate card per order or patient category.

---

## 11. Language & Preferences

### 11.1 Switching Language

LabCore supports **English** and **Malayalam**.

1. Use the **language dropdown** in the top-right corner of the header.
2. Select your preferred language.
3. The UI refreshes immediately in the selected language.
4. Your preference is saved for future sessions.

---

## Quick Reference: Common Workflows

### End-to-End Flow: Patient Visit to Report Delivery

```
Patient arrives
    │
    ▼
Register patient (or look up existing)
    │
    ▼
Create order (select tests, apply discount)
    │
    ▼
Invoice generated automatically
    │
    ▼
Collect sample → Receive at lab
    │
    ▼
Enter test results
    │
    ▼
Pathologist reviews + authorises
    │
    ▼
PDF report auto-generated
    │
    ▼
Share via WhatsApp / Print / Download
```

### User Roles Summary

| Role              | Can Do                                                                                      |
|-------------------|---------------------------------------------------------------------------------------------|
| Front Desk        | Register patients, create orders, manage samples, record payments, share reports            |
| Technician        | Collect/receive samples, enter results                                                      |
| Senior Technician | All Technician tasks + review results                                                       |
| Pathologist       | Review, authorise, and amend results; add interpretive comments                             |
| Admin             | Everything above + manage users, settings, test master, rate cards, lab profile              |

---

*For administrator and system configuration tasks, see the [Admin Guide](admin-guide.md).*
*For deployment and infrastructure, see the [Deployment Guide](deployment-guide.md).*
