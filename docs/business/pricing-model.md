# Pricing and Business Model

**LabCore LIMS** | Business Document | February 2025

---

## 1. Pricing Philosophy

LabCore's pricing is designed around one insight: small pathology labs in India earn INR 50,000--1,50,000/month. Software that costs more than 2--3% of revenue will not be adopted, no matter how good it is.

**Guiding principles:**
- Entry plan under INR 500/month -- makes adoption a no-brainer decision
- No onboarding fees -- removes the upfront risk barrier
- Transparent pricing -- every feature and its plan clearly listed; no "contact sales" opacity
- Scale with the customer -- pricing grows as the lab grows, not before
- Include essentials in every plan -- audit trails, WhatsApp sharing, and Malayalam UI are not premium add-ons

---

## 2. Subscription Tiers

### 2.1 Free Trial

| Attribute | Detail |
|-----------|--------|
| Duration | 30 days |
| Access | Full Growth plan features |
| Users | Up to 5 |
| Credit card required | No |
| Purpose | Let the lab experience the full product with real data before committing |
| Conversion target | 30--40% trial-to-paid conversion |

### 2.2 Starter Plan -- INR 499/month

| Attribute | Detail |
|-----------|--------|
| Price (excl. GST) | INR 499/month |
| Price (incl. 18% GST) | INR 589/month |
| Annual price (excl. GST) | INR 4,999/year (save ~17%) |
| Target lab | Very small lab, 1--3 staff, 20--50 tests/day |
| Users | 2 |
| Patient records | Unlimited |
| Report storage | 3 years |

**Included features:**
- Patient registration and order entry (pre-loaded test master)
- Barcode/QR label generation
- Manual result entry with reference ranges and abnormal flagging
- Multi-level result authorisation (2 levels)
- PDF report generation with lab branding and digital signature
- WhatsApp report sharing via wa.me share links (unlimited, zero cost)
- GST-compliant billing and invoicing
- Basic dashboard (today's summary)
- User roles and access control (Admin + Front Desk/Technician)
- Audit trail (immutable)
- Malayalam + English UI
- Data export (CSV)

**Not included:**
- Analyser interfacing
- IQC/QC management
- B2B billing
- Patient/Doctor portals
- Inventory management
- Multi-branch support

### 2.3 Growth Plan -- INR 999/month

| Attribute | Detail |
|-----------|--------|
| Price (excl. GST) | INR 999/month |
| Price (incl. 18% GST) | INR 1,179/month |
| Annual price (excl. GST) | INR 9,999/year (save ~17%) |
| Target lab | Small-to-medium lab, 3--8 staff, 50--150 tests/day |
| Users | 5 |
| Patient records | Unlimited |
| Report storage | 5 years |

**Everything in Starter, plus:**
- Analyser interfacing (up to 3 instruments)
- IQC with Westgard rules and Levey-Jennings charts
- Delta check
- Critical value alerting and notification log
- B2B/corporate billing with credit management
- Referral doctor commission tracking
- Inventory and reagent management (basic)
- WhatsApp report sharing (unlimited, zero cost)
- Advanced dashboard (TAT metrics, revenue trends)
- Data export (CSV + JSON)
- Priority support (WhatsApp, response within 4 hours)

### 2.4 Pro Plan -- INR 1,499/month

| Attribute | Detail |
|-----------|--------|
| Price (excl. GST) | INR 1,499/month |
| Price (incl. 18% GST) | INR 1,769/month |
| Annual price (excl. GST) | INR 14,999/year (save ~17%) |
| Target lab | Medium lab, 5--10+ staff, 100--300 tests/day, multiple locations |
| Users | 10 |
| Patient records | Unlimited |
| Report storage | 7 years |

**Everything in Growth, plus:**
- Multi-branch support (up to 5 locations)
- Centralised dashboard across branches
- Patient portal (OTP login, report download)
- Doctor/referral portal (report access, commission statements)
- Home collection mobile workflow
- Analyser interfacing (up to 6 instruments)
- Advanced inventory with vendor management and reorder alerts
- WhatsApp report sharing (unlimited, zero cost)
- EQA/PT tracking
- API access for third-party integrations
- Dedicated support contact

### 2.5 Custom Plan -- Quote-Based

| Attribute | Detail |
|-----------|--------|
| Target | Labs with specific needs: more users, more branches, custom features, on-site training |
| Pricing | Based on requirements; minimum INR 2,000/month |
| Includes | Everything in Pro + custom development, additional integrations, SLA guarantees, on-site training |

---

## 3. Pricing Comparison with Competitors

| Feature | LabCore Starter (INR 499) | LabCore Growth (INR 999) | Drlogy Paid (~INR 1,667) | CrelioHealth Standard (INR 8,000) |
|---------|:------------------------:|:------------------------:|:------------------------:|:---------------------------------:|
| Users | 2 | 5 | Varies | 6 |
| WhatsApp sharing | Unlimited (free) | Unlimited (free) | Partial | Add-on |
| Audit trail | Yes | Yes | No | Yes |
| Analyser interfacing | -- | 3 instruments | No | 3 instruments |
| IQC (Westgard) | -- | Yes | No | Yes |
| Malayalam UI | Yes | Yes | No | No |
| Offline mode | Yes | Yes | No | Limited |
| Onboarding fee | INR 0 | INR 0 | Varies | INR 10,000 |
| **Total Year 1 cost** | **INR 5,988** | **INR 11,988** | **~INR 20,000** | **INR 1,06,000+** |

LabCore Growth delivers comparable features to CrelioHealth Standard at ~11% of the cost.

---

## 4. Add-On Services and Revenue Streams

### 4.1 Additional Analyser Interfacing

| Item | Price |
|------|-------|
| Additional instrument (beyond plan limit) | INR 500/instrument/month |
| One-time interfacing setup (per instrument) | INR 2,000 |

### 4.3 Custom Development

| Service | Price Range |
|---------|------------|
| Custom report template design | INR 2,000--5,000 per template |
| Custom workflow/feature development | INR 500--1,000/hour |
| Data migration from existing system | INR 5,000--15,000 (based on complexity) |
| On-site training (Kerala) | INR 3,000--5,000/day + travel |
| Video call onboarding session | Free (30 minutes) |

### 4.4 Revenue Stream Summary

| Stream | Type | Expected Contribution (Year 1) |
|--------|------|-------------------------------|
| SaaS subscriptions | Recurring monthly | 75--85% |
| Custom development | One-time | 10--15% |
| Analyser interfacing setup | One-time | 5--10% |
| Training | One-time | < 5% |

---

## 5. Cost Structure

### 5.1 Infrastructure Cost (Per-Lab Allocation)

With 100 paying labs, infrastructure runs on Vercel + Supabase free tier (INR 0 at MVP scale; see architecture document):

| Cost Item | Monthly Total | Per Lab |
|-----------|--------------|---------|
| Infrastructure (Vercel + Supabase free tier) | INR 0 | INR 0 |
| Domain, SSL, misc services | INR 2,000 | INR 20 |
| **Total infrastructure per lab** | | **INR 20** |

Note: WhatsApp report sharing uses free wa.me deep links -- zero recurring cost. No SMS gateway is used.

### 5.2 Operational Cost

| Cost Item | Monthly |
|-----------|---------|
| Customer support (1 part-time resource initially) | INR 15,000 |
| Cloud monitoring and DevOps time | INR 10,000 (founder time) |
| Accounting and compliance | INR 5,000 |
| **Total operational** | **INR 30,000** |

### 5.3 Unit Economics

At 100 labs with average revenue of INR 750/lab/month:

| Metric | Value |
|--------|-------|
| Monthly revenue | INR 75,000 |
| Infrastructure cost | INR 2,000 (domain, SSL, misc; Vercel + Supabase free tier) |
| Operational cost | INR 30,000 |
| **Net margin** | **INR 43,000 (57%)** |

At 200 labs (infrastructure may remain on free tier or low paid tier):

| Metric | Value |
|--------|-------|
| Monthly revenue | INR 1,50,000 |
| Infrastructure cost | INR 2,000--5,000 (scale to paid tiers only if needed) |
| Operational cost | INR 40,000 |
| **Net margin** | **INR 1,05,000--1,08,000 (70%+)** |

---

## 6. Break-Even Analysis

### 6.1 Pre-Launch Investment

| Cost | Amount | Notes |
|------|--------|-------|
| Development (6 months, founder + 1 developer) | INR 0 (founder equity) + INR 1,80,000 (developer at INR 30K/mo) | Assumes founder as primary developer |
| Infrastructure (staging + dev, 6 months) | INR 0 | Vercel + Supabase free tier during development |
| Domain, branding, legal | INR 20,000 | Domain, logo, GSTIN registration, T&C |
| **Total pre-launch** | **~INR 2,00,000** |

### 6.2 Break-Even Point

| Scenario | Labs Needed | Timeline |
|----------|-------------|----------|
| Monthly break-even (revenue >= monthly costs) | ~65 labs at INR 750 avg | Month 5--8 after launch |
| Cumulative break-even (recover pre-launch investment) | ~80--100 labs sustained for 4--6 months | Month 9--13 after launch |

---

## 7. Pricing Strategy Principles

### 7.1 Anchoring

- Always show the Starter plan first (INR 499) -- anchors the price perception as "affordable"
- Show the comparison to CrelioHealth's INR 8,000 prominently on the pricing page
- Use "INR 16/day" framing for the Starter plan (less than a cup of tea)

### 7.2 Annual Discount

- 17% discount for annual prepayment (effectively 10 months for the price of 12)
- Improves cash flow and reduces churn (annual commitment)
- Displayed as "Save INR 1,000/year" on the pricing page

### 7.3 No Hidden Costs

- All pricing on the website includes a clear breakdown
- GST shown separately (as per Indian norm)
- WhatsApp sharing is free and unlimited in all plans -- clearly stated
- No "contact us for pricing" -- every plan publicly listed

### 7.4 Free Trial Design

- 30 days, no credit card required
- Full Growth plan access (not a crippled trial)
- Onboarding wizard guides the lab through setup
- Day 20 reminder: "Your trial ends in 10 days. Subscribe to keep your data."
- Day 28 reminder: "Your trial ends in 2 days. Your data will be preserved for 30 more days after trial ends."
- Post-trial: Data preserved (read-only) for 30 days; then archived for 90 days; then deleted
