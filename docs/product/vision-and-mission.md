# Product Vision and Mission

**LabCore LIMS** | Product Document | February 2025

---

## 1. Vision Statement

> **Every small lab in India deserves a modern, affordable LIMS.**

Tens of thousands of small pathology and diagnostic labs across India operate on paper registers, Excel spreadsheets, and handwritten reports -- not because they don't want technology, but because existing LIMS products are too expensive, too complex, or too irrelevant for their needs.

LabCore exists to change that.

---

## 2. Mission Statement

> **Make laboratory information management accessible, affordable, and delightful for small medical diagnostic and pathology labs -- starting from Kerala.**

We will build software that a pathologist in Irinjalakuda or a lab technician in Perinthalmanna can start using within 15 minutes, at a cost lower than their monthly electricity bill, and see immediate improvements in report quality, turnaround time, and patient satisfaction.

---

## 3. Core Principles

These principles guide every product, design, and business decision for LabCore.

### 3.1 Simplicity Over Feature Bloat

We do fewer things, but we do them perfectly. A small lab with 2 staff does not need franchise management, PACS integration, or ERP connectors. Every feature we build must pass the test: "Will a 2-person pathology lab use this in their daily workflow?"

If the answer is no, it doesn't go into the core product.

### 3.2 Affordable Over Premium

Our pricing reflects the economic reality of our customers. A lab earning INR 60,000--1,50,000/month cannot spend INR 8,000--15,000/month on software. Our entry plan must cost less than INR 500/month. We achieve this through efficient engineering, low customer acquisition cost, and a lean operating model -- not by offering a stripped-down, frustrating product.

### 3.3 Kerala-First, Then India

We start in Kerala because we understand the market, the language, and the regulatory environment. We build for Kerala's small labs, earn their trust, collect their feedback, and refine the product. Then we expand to neighbouring states (Tamil Nadu, Karnataka, Goa) and eventually across India. We do not chase national scale before we have product-market fit in one state.

### 3.4 Opinionated Defaults, Flexible When Needed

We ship with sensible defaults that work for 90% of small Indian pathology labs: pre-loaded test definitions, reference ranges, report templates, and billing structures. A lab can be operational within 15 minutes of signing up. For the 10% who need customisation, we offer flexible configuration -- but we never sacrifice simplicity for configurability.

### 3.5 WhatsApp Is the Platform

In India, WhatsApp is the communication platform for healthcare. Patients receive reports via WhatsApp. Doctors communicate via WhatsApp. Lab owners check their dashboards on their phones. We design for WhatsApp-first sharing -- one-click share links that open WhatsApp with the report pre-attached -- as the primary report delivery channel, at zero cost.

### 3.6 Offline Is Not Optional

Internet connectivity in semi-urban and rural Kerala is unreliable. A LIMS that stops working when the internet goes down is not acceptable for a lab processing patient samples. LabCore must function fully offline and sync when connectivity returns. This is a core architectural requirement, not a nice-to-have.

### 3.7 NABL-Ready From Day One

Even labs that are not yet NABL-accredited should be building audit trails, QC records, and documentation habits. We include NABL-readiness features (audit trails, result authorisation workflows, QC logging) in every plan, including the cheapest. When a lab decides to pursue NABL accreditation, their LabCore data is already in the right shape.

### 3.8 No Vendor Lock-In

Labs must own their data. LabCore provides full data export in standard formats (CSV, JSON, HL7 FHIR) from day one, in every plan. If a lab decides to switch to another system, they can take all their data with them. Trust is built by not holding data hostage.

---

## 4. What LabCore IS

| Dimension | LabCore |
|-----------|---------|
| Target customer | Small standalone pathology labs and small diagnostic centres (1--10 staff) |
| Primary geography | Kerala, India (expanding to South India, then all India) |
| Primary language | Malayalam + English |
| Price range | INR 499--1,499/month |
| Deployment | Cloud SaaS with offline-first PWA |
| Onboarding | Self-service in 15 minutes; optional guided onboarding via video call |
| Feature philosophy | Core workflow done perfectly: register, bill, collect, enter results, generate report, share via WhatsApp |
| Compliance | NABL-ready audit trails included in all plans |
| Support model | WhatsApp-based support (the channel our customers already use) |

---

## 5. What LabCore IS NOT

| Dimension | Not LabCore |
|-----------|-------------|
| Enterprise LIMS | We do not build for large hospital chains, reference labs, or multi-hundred-user setups |
| Competitor to CrelioHealth/LabWare | We operate in a different segment; they serve mid-to-large labs, we serve small labs |
| Hospital Information System (HIS) | We do not manage hospital operations, OPD, IPD, or EMR |
| Radiology/PACS system | We do not manage imaging workflows, DICOM, or radiology reporting |
| Full ERP/accounting system | We provide lab billing, not general accounting; we integrate with Tally/Zoho, not replace them |
| Research LIMS | We are not designed for pharmaceutical R&D, biobanking, or genomics workflows |
| Custom software house | We build a product, not custom software per client; customisation is configuration, not code changes |

---

## 6. Success Metrics (First 12 Months)

| Metric | Target |
|--------|--------|
| Paying customers (Kerala) | 100--200 labs |
| Monthly churn rate | < 5% |
| Average onboarding time | < 30 minutes |
| Customer NPS (Net Promoter Score) | > 50 |
| Average TAT improvement for customers | 50%+ reduction vs. paper-based workflow |
| WhatsApp report sharing adoption | 80%+ of customers using it actively |
| Support ticket resolution time | < 4 hours (during business hours) |

---

## 7. Long-Term Vision (3--5 Years)

1. **Year 1**: Product-market fit in Kerala. 100--200 paying labs. Stable, loved product.
2. **Year 2**: Expand to Tamil Nadu and Karnataka. Add analyser interfacing, multi-branch, and B2B features. 500--1,000 labs.
3. **Year 3**: ABDM integration, AI-assisted reporting, NABL documentation module. 2,000+ labs across South India.
4. **Year 4--5**: Pan-India expansion with multi-language support (Hindi, Bengali, Marathi, Telugu). Partner with medical equipment distributors for bundled offerings. 5,000+ labs.

The goal is not to become the biggest LIMS in India. The goal is to become the **most trusted and loved LIMS among small labs in India**.
