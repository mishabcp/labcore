# Target User Personas

**LabCore LIMS** | Research Document | February 2025

---

## Overview

LabCore serves five distinct user types. Each persona represents a real category of person who will interact with the system. The product must be designed to satisfy the primary personas (1 and 2) first, while ensuring a smooth experience for supporting personas (3, 4, 5).

---

## Persona 1: Dr. Suresh -- Small Standalone Pathology Lab Owner

### Demographics
| Attribute | Detail |
|-----------|--------|
| Age | 52 |
| Location | Irinjalakuda, Thrissur district, Kerala |
| Education | MD Pathology |
| Role | Owner, pathologist, and sole decision-maker |
| Lab size | 2 technicians + 1 front desk staff |
| Daily volume | 25--40 tests/day |
| Monthly revenue | INR 60,000--80,000 |
| Current system | Paper registers, handwritten reports, billing in a ruled notebook |

### Goals
- Generate typed, professional-looking reports quickly to compete with chain lab branches opening nearby
- Send reports via WhatsApp to patients and referring doctors without manually photographing handwritten reports
- Track daily collections accurately -- currently loses track of cash vs UPI payments
- Prepare for NABL accreditation, which a nearby government hospital now requires for referrals

### Frustrations
- Tried Drlogy's free plan once; found it confusing and couldn't figure out how to customise report templates -- gave up after 2 days
- CrelioHealth's sales team quoted INR 8,000/month + INR 20,000 onboarding -- "more than my electricity bill"
- Patients complain about delayed reports; the chain lab next door delivers via WhatsApp in 2 hours
- Writes the same patient's details from scratch every time they visit; no historical record
- Spends 30 minutes every evening reconciling cash and UPI payments manually

### Tech Comfort
- Uses WhatsApp, Google Maps, and YouTube on his smartphone
- Has a 5-year-old desktop at the lab running Windows 10
- Types slowly; prefers clicking/tapping over typing
- Will not read a user manual; needs to learn by doing

### Budget for Software
- Willing to pay INR 500--1,000/month if he can see clear value within the first week
- Will not pay an upfront onboarding fee
- Wants a free trial before committing

### What LabCore Must Deliver for This Persona
- Register a patient and generate a report in under 5 minutes on first use
- WhatsApp report delivery with one click
- Malayalam option for patient-facing report sections
- GST billing with UPI/cash tracking
- Zero onboarding fee; 30-day free trial

---

## Persona 2: Anitha -- Small Diagnostic Centre Owner

### Demographics
| Attribute | Detail |
|-----------|--------|
| Age | 38 |
| Location | Perinthalmanna, Malappuram district, Kerala |
| Education | MBBS with diploma in Clinical Pathology |
| Role | Owner and supervising doctor |
| Lab size | 5 technicians + 2 front desk + 1 phlebotomist (home collection) |
| Daily volume | 80--120 tests/day |
| Monthly revenue | INR 1,50,000--2,50,000 |
| Current system | Excel for billing, printed reports from a Word template, WhatsApp for report delivery (manual PDF conversion) |

### Goals
- Streamline the end-to-end workflow: registration to billing to result entry to report delivery
- Track referral doctor commissions accurately -- currently managed in a separate Excel sheet with frequent disputes
- Connect her Mindray BC-30s haematology analyser to the software to eliminate manual result transcription
- Open a second collection centre in Tirur and manage both locations from one system
- Get NABL accreditation within the next 18 months

### Frustrations
- Her current Excel+Word system breaks down when volume exceeds 80 tests/day; staff make copy-paste errors
- Manually converting Word reports to PDF, then sending individually via WhatsApp takes 1 hour every evening
- Cannot track which samples are pending, completed, or delivered in real time
- Her accountant complains about inconsistent billing records
- Tried a local vendor's custom software (built in VB.NET) -- it crashed frequently and the developer became unresponsive

### Tech Comfort
- Comfortable with Excel, WhatsApp, and basic computer use
- Can navigate web applications with minimal guidance
- Prefers a short onboarding call over reading documentation
- Her technicians are young (22--28 years) and tech-savvy

### Budget for Software
- Willing to pay INR 1,000--1,500/month for a reliable system
- Would consider INR 2,000/month if analyser interfacing is included
- Expects the software to pay for itself through time savings and error reduction

### What LabCore Must Deliver for This Persona
- Full workflow: registration, billing, result entry, report generation, WhatsApp delivery
- Barcode label printing for sample tracking
- Referral doctor tracking with commission reports
- Multi-level authorisation (technician enters, Anitha validates and signs)
- Analyser interfacing (Phase 2) for her Mindray equipment
- Multi-branch support (Phase 2) when she opens the Tirur centre
- NABL audit trail from day one

---

## Persona 3: Vishnu -- Lab Technician

### Demographics
| Attribute | Detail |
|-----------|--------|
| Age | 26 |
| Location | Aluva, Ernakulam district, Kerala |
| Education | BSc MLT (Medical Laboratory Technology) |
| Role | Senior technician at a small diagnostic lab |
| Daily tasks | Runs analyser, enters results, prepares reports, handles sample accessioning |
| Salary | INR 15,000--20,000/month |
| Current system | Lab owner's Excel sheets + handwritten result slips |

### Goals
- Finish entering results and generating reports faster so he can leave on time (currently stays 1--2 hours late daily)
- Reduce errors in manual transcription -- his lab owner blames him when values are wrong
- Have a clear worklist showing which samples are pending so he doesn't miss any
- Learn to use modern lab software to improve his career prospects

### Frustrations
- Entering CBC results manually into Excel takes 3--4 minutes per patient; with 60+ patients/day that's 3+ hours just on data entry
- No way to track which samples he has processed and which are pending
- When the analyser prints a result strip, he copies values to Excel -- transposition errors happen regularly
- Gets phone calls from the front desk asking "is patient X's report ready?" 20+ times a day
- The lab owner wants barcoded tubes but the current Excel system doesn't support barcode printing

### Tech Comfort
- Very comfortable with smartphones and computers
- Uses Instagram, YouTube, and online learning platforms
- Can pick up new software quickly with a brief walkthrough
- Would prefer a mobile-friendly interface for quick tasks

### Budget for Software
- Not the buyer (lab owner decides), but his recommendation carries weight
- Values speed and ease of use above all else

### What LabCore Must Deliver for This Persona
- Fast result entry screen: keyboard-optimised, tab-through fields, auto-calculated derived values
- Clear pending/completed worklist per department
- Barcode scanning to pull up patient and test details instantly
- Abnormal value highlighting with reference ranges
- Real-time status updates visible to front desk without phone calls

---

## Persona 4: Dr. Meera -- Referring Doctor

### Demographics
| Attribute | Detail |
|-----------|--------|
| Age | 45 |
| Location | Kozhikode, Kerala |
| Education | MD General Medicine, private practice |
| Role | Referring physician who sends patients to multiple labs |
| Daily referrals | 8--15 patients/day referred for lab tests |
| Current workflow | Writes test requisition on prescription pad; patient goes to lab; lab sends report via WhatsApp to patient; patient brings report to next visit |

### Goals
- Receive lab reports directly and instantly -- not wait for the patient to forward them
- Compare a patient's current results with their previous results without flipping through old paper reports
- Trust the lab's reports -- wants to see NABL accreditation logo and QR verification
- Track referral commissions transparently without awkward monthly conversations with the lab owner

### Frustrations
- Patients often forget to forward their reports; she has to call the lab
- When patients do forward reports via WhatsApp, they send blurry photos of handwritten reports
- No way to see trends in a patient's lab values over time
- Referral commission is a verbal agreement; she never knows if it's calculated correctly

### Tech Comfort
- Uses WhatsApp extensively for professional communication
- Comfortable with basic web portals (banks, insurance)
- Will not install a dedicated app for one lab -- too many apps already
- Would use a WhatsApp-based notification + web portal combo

### Budget for Software
- Not the buyer; the lab pays. But her satisfaction determines whether she continues referring patients to a lab

### What LabCore Must Deliver for This Persona (Phase 2)
- Automatic WhatsApp notification when a referred patient's report is ready, with PDF attached
- Simple web portal (OTP login) to view all referred patients' reports
- Historical report comparison for repeat patients
- Monthly referral commission statement accessible via portal
- No app installation required

---

## Persona 5: Ramesh -- Patient

### Demographics
| Attribute | Detail |
|-----------|--------|
| Age | 35 |
| Location | Chalakudy, Thrissur district, Kerala |
| Education | Plus Two (12th grade) |
| Occupation | Auto-rickshaw driver |
| Language preference | Malayalam |
| Tech access | Android smartphone (budget model), WhatsApp, UPI payments |

### Goals
- Get his lab report quickly (same day) so he can show it to his doctor
- Receive the report on WhatsApp -- doesn't want to make another trip to the lab to collect it
- Understand whether his results are normal or abnormal without needing a doctor to explain every value
- Keep a digital copy of all his reports in one place for future reference

### Frustrations
- Last time, the lab gave him a handwritten report he couldn't read; his doctor also struggled to read it
- He had to visit the lab twice -- once for the test, once to collect the report the next day (lost half a day of work)
- Doesn't understand medical terminology in English; wishes reports had some Malayalam
- Lost his old paper reports during house cleaning; when the doctor asked for previous reports, he had nothing

### Tech Comfort
- Expert WhatsApp user (voice notes, video calls, group chats)
- Uses Google Pay for all UPI transactions
- Can open a PDF on WhatsApp and zoom in to read
- Cannot navigate complex web forms or portals

### Budget for Software
- Not the buyer; the lab pays. But his satisfaction determines whether he returns to the same lab or switches to the chain lab

### What LabCore Must Deliver for This Persona
- Report delivered via WhatsApp as a clean, readable PDF within 2--3 hours of sample collection
- QR code on report for authenticity verification
- Abnormal values clearly highlighted with reference ranges (even a non-medical person should understand "high" or "low")
- Malayalam option for patient name, basic report sections, and interpretive notes
- No app download, no portal login, no complex steps -- WhatsApp is the channel

---

## Persona Priority Matrix

| Persona | Role in Purchase Decision | Frequency of Use | MVP Priority |
|---------|--------------------------|-------------------|--------------|
| Dr. Suresh (Lab Owner, small) | **Buyer** -- makes the purchase decision | Daily (reviews/signs reports) | **P0 -- must satisfy** |
| Anitha (Lab Owner, medium) | **Buyer** -- makes the purchase decision | Daily (oversees operations) | **P0 -- must satisfy** |
| Vishnu (Technician) | **Influencer** -- recommends to owner | All day, every day (power user) | **P0 -- must satisfy** |
| Dr. Meera (Referring Doctor) | **Indirect influencer** -- refers patients to labs that give good reports | Occasional (receives reports) | **P1 -- Phase 2** |
| Ramesh (Patient) | **End consumer** -- chooses lab based on experience | Occasional (receives reports) | **P1 -- report quality matters in MVP** |

---

## Design Implications Summary

| Insight | Design Decision |
|---------|----------------|
| Lab owners (Persona 1) won't read manuals | Guided first-use wizard; tooltips; learning by doing |
| Technicians (Persona 3) need speed | Keyboard-first result entry; barcode scanning; minimal clicks |
| Patients (Persona 5) rely on WhatsApp | WhatsApp PDF delivery as a core feature, not an add-on |
| Referring doctors (Persona 4) want transparency | Auto-notifications, commission statements, web portal |
| Malayalam is the preferred language for 60%+ of end users | Full UI localization + Malayalam report templates from MVP |
| Older users type slowly | Large click targets, dropdown selections over free text, auto-complete |
| Budget constraints are severe | No onboarding fee, INR 499 entry price, 30-day free trial |
