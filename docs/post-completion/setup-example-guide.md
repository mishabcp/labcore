# Real-World Lab Setup & Usage Guide

This guide walks you through a completely functional, real-world example of how a brand new laboratory—"City Health Diagnostics"—can set up and begin using the LabCore LIMS software from day one.

## Phase 1: Registration & Initial Setup

Let's imagine Dr. Smith is the owner of **City Health Diagnostics**.

1. **Lab Registration**:
   * Dr. Smith navigates to `labcore.com/auth/register-lab`.
   * He enters his lab's details (Name: City Health Diagnostics, Email, Phone, Address).
   * He creates his Super Admin account (`smith@cityhealth.com`).
   * **Result**: The system creates a dedicated, isolated partition in the database just for City Health Diagnostics.

2. **Setting Up Tests (The Test Catalog)**:
   * Dr. Smith logs in. He navigates to **Tests** in the dashboard.
   * By default, the system comes with hundreds of pre-defined tests (like Complete Blood Count, Lipid Profile, etc.). 
   * However, every lab is different! He wants to add a specific test he performs: "Fasting Blood Sugar".
   * He clicks **Add Test**, names it, and adds the parameter (`Glucose`) with his specific lab machine's normal reference range (`70 - 100 mg/dL`).

3. **Setting Up Pricing (Rate Cards)**:
   * Next, Dr. Smith navigates to **Settings > Rate Cards**.
   * He creates a "Standard Walk-in Rate Card". 
   * He finds the "Complete Blood Count" test and sets the price to `$40`.
   * He finds his new "Fasting Blood Sugar" test and sets the price to `$20`.

4. **Inviting Staff**:
   * Dr. Smith goes to the **Users** management page.
   * He enters his front desk clerk's email (`sarah@cityhealth.com`) and assigns her the **Front Desk** role.
   * He adds his technician (`john@cityhealth.com`) with the **Technician** role.
   * Sarah and John receive emails to log in and set up their passwords.

---

## Phase 2: A Patient Walks In 

Now that the system is configured, let's look at a typical morning shift.

1. **Patient Arrival**:
   * A patient named "Michael" walks into the lab because his doctor ordered a Fasting Blood Sugar test.
   * He speaks to Sarah at the front desk.

2. **Registration (Sarah)**:
   * Sarah logs into LabCore.
   * She navigates to **Patients** -> **Register Patient**.
   * She enters Michael's details: "Michael Johnson, 45, Male, Phone...".

3. **Ordering the Test (Sarah)**:
   * Right after registering, she clicks **New Order** for Michael.
   * The system asks her which Rate Card to use. She selects "Standard Walk-in Rate Card".
   * She searches for "Fasting Blood Sugar" and adds it to the order. The system automatically calculates the price is `$20`.
   * Michael pays the $20 in cash. Sarah logs the payment and clicks "Confirm Order".
   * An Invoice is automatically generated. She hands it to Michael and tells him to go to the collection room.

---

## Phase 3: Sample Collection & Processing

1. **Drawing Blood (John the Technician)**:
   * John is working back in the collection room. He looks at his LabCore Dashboard and sees a new order just popped up under "Pending Collections".
   * He sees he needs to draw blood for Michael's Fasting Blood Sugar test.
   * Michael comes in. John draws his blood into a Fluoride tube.
   * John clicks **Mark as Collected** on his dashboard next to Michael's name.

2. **Running the Machine**:
   * John puts the sample into the laboratory analyzer machine and waits for the physical results. Let's say the machine prints out that Michael's glucose level is `115 mg/dL`.

3. **Entering the Results (John)**:
   * John logs back into LabCore and goes to the **Pending Results** page. 
   * He opens Michael's test and types `115` into the specific result field.
   * Because `115` is higher than the normal range set by Dr. Smith (`70 - 100`), the system immediately flags the number red and marks it as "Abnormal - High".
   * John clicks "Submit for Review".

---

## Phase 4: Finalizing & Reporting

1. **Medical Review (Dr. Smith)**:
   * Throughout the day, Dr. Smith checks the **Pending Authorization** tab on his dashboard.
   * He opens Michael's test. He sees the user who entered the result (John) and the high value (`115`).
   * He confirms the inputs look correct and clicks **Authorise**.
   * Because Dr. Smith's digital signature was uploaded to his profile, it is instantly appended to the record.

2. **Generating the Report (Sarah / Front Desk)**:
   * Back at the front desk, Michael returns from the waiting room.
   * Sarah sees the test status is now green and marked "Authorised".
   * She clicks the big **Generate Report** button next to Michael's order.
   * LabCore instantly generates a PDF Document containing:
     * City Health Diagnostics' Header & Contact Info
     * Michael's Details & Assigned Barcode
     * The Test Result (Fasting Blood Sugar: **115 mg/dL** [FLAGGED HIGH])
     * Normal Reference Range (70 - 100 mg/dL)
     * Dr. Smith's secure digital signature.
   * Sarah prints the PDF and hands it to Michael. The workflow is complete!
