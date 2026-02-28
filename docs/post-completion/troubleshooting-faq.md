# LabCore LIMS — Troubleshooting / FAQ

**Version**: 1.0 · **Last Updated**: February 2026

---

## Table of Contents

1. [Login & Authentication](#1-login--authentication)
2. [Patient & Order Issues](#2-patient--order-issues)
3. [Sample Tracking](#3-sample-tracking)
4. [Result Entry](#4-result-entry)
5. [Report Generation & Sharing](#5-report-generation--sharing)
6. [Billing & Invoices](#6-billing--invoices)
7. [Admin & Settings](#7-admin--settings)
8. [Performance](#8-performance)
9. [Deployment & Infrastructure](#9-deployment--infrastructure)

---

## 1. Login & Authentication

### I can't log in

- **Check credentials**: Ensure you are using the correct mobile number and password.
- **Account deactivated**: Your admin may have deactivated your account. Contact them.
- **Caps Lock**: Passwords are case-sensitive. Check that Caps Lock is off.
- **Demo credentials**: For seeded databases, try mobile `9876543210`, password `demo123`.

### "Login failed" error

- **API down**: The backend API may not be running. Check if `<API_URL>/health` returns HTTP 200.
- **Network**: Ensure your device is connected to the internet and the API URL is reachable.
- **CORS**: If running locally with a different port, check browser console for CORS errors.

### Session expired

Access tokens expire after 1 hour. The app should refresh them automatically using the refresh token. If you are still logged out:
- Clear browser data and log in again.
- Refresh tokens expire after 7 days of inactivity. If it's been over 7 days, you'll need to log in afresh.

### I forgot my password

Contact your lab admin. Admins can reset your password from **Settings → Users → Reset Password**.

---

## 2. Patient & Order Issues

### Duplicate patient was created

LabCore does not automatically block duplicate entries if the name differs slightly. To avoid this:
- Always **search** for the patient by mobile number before creating a new record.
- If a duplicate exists, create new orders under the original patient record.

### Can't cancel an order

- Orders can only be cancelled by users with **Admin**, **Pathologist**, or **Front Desk** roles.
- A **cancel reason** is required.
- If results have already been entered for a test, that individual order item cannot be cancelled — only items without results can be cancelled.

### Can't find a test in the dropdown

- The test may have been **deactivated** by an admin. Check **Settings → Test Master**.
- Try searching by **test code** in addition to test name.
- If the test doesn't exist, an admin can add it via the Test Master.

---

## 3. Sample Tracking

### Sample status is not updating

- Ensure you are selecting the correct status from the dropdown and confirming.
- Check your internet connection — status changes require an API call.
- If the sample is in **Rejected** status, it cannot be moved to another status.

### Why was a sample rejected?

- The rejection reason is recorded when the status is changed to "Rejected".
- Check the sample details page for the documented reason and the rejecting user.
- Common reasons: Hemolyzed, Clotted, Insufficient Quantity, Mislabeled, Wrong Container.

---

## 4. Result Entry

### Out-of-range values are flagged

This is expected behaviour. LabCore automatically flags values as:
- **L** (Low) — below the reference range
- **H** (High) — above the reference range
- **C** (Critical) — outside panic/critical limits

Flags are based on the patient's **age** and **gender** and the reference ranges configured in the Test Master.

### Can't edit results after authorisation

Once a result is **Authorised**, it is locked. To correct an error:
1. A **Pathologist** or **Admin** must use the **Amend Report** function.
2. This creates a new version of the report with an "Amended" designation.
3. The original version is retained in history.

### Calculated fields are not auto-computing

Some test parameters have calculated values (e.g. A/G Ratio = Albumin ÷ Globulin). If these are not computing:
- Ensure the dependent parameter values have been entered and saved.
- Check that the formula is configured correctly in the Test Master.

---

## 5. Report Generation & Sharing

### PDF report is not generating

- **Lab profile incomplete**: Ensure lab logo, name, and pathologist signature are configured in **Settings → Lab Profile**.
- **Results not authorised**: Reports are only generated after results are **Authorised**.
- **PDF service down**: PDF generation uses a Puppeteer-based service. Check that the pdf-service package is running.

### WhatsApp share link not working

- The share uses a `wa.me` deep link. It requires WhatsApp to be installed on the device (or WhatsApp Web on desktop).
- The patient must have a **valid mobile number** in their record.
- Share links are valid for **24 hours** — if the link has expired, generate a new one.

### Report QR code verification fails

- The QR code links to `/public/reports/verify/:code`. Ensure the public API endpoint is accessible.
- Check that `NEXT_PUBLIC_API_URL` (or `API_BASE_URL`) is correctly configured for the production API URL.

---

## 6. Billing & Invoices

### Invoice amount seems wrong

- **Check discount**: A discount may have been applied at order or test level.
- **GST**: Invoices include 18% GST by default.
- **Rate card**: The order may be using a different rate card than expected. Check which rate card was applied.

### Can't record a payment

- Only **Admin** and **Front Desk** users can record payments.
- Check that the invoice exists and has an outstanding balance.

### Invoice shows wrong status

Invoice statuses update automatically:
- **Paid**: `amountDue` is 0
- **Partial**: Some payment recorded but balance remains
- **Pending**: No payment recorded

---

## 7. Admin & Settings

### Can't add a new user

- Only **Admin** users can manage users.
- Ensure the mobile number is unique — two users in the same lab cannot share a mobile number.
- Check that all required fields are filled (name, mobile, role, password).

### Changes to Test Master are not showing

- Changes to test definitions (prices, parameters, reference ranges) apply to **new orders only**.
- Existing orders and results are not retroactively affected.
- If you deactivated a test, it will no longer appear in the order entry dropdown.

### Logo or signature upload fails

- **File format**: Only PNG and JPG are accepted.
- **File size**: Keep files under 2 MB.
- **Signature**: Use a PNG with a **transparent background** for best results on reports.

---

## 8. Performance

### Pages are loading slowly

- **Network**: Check your internet speed, especially on 3G/4G connections.
- **Large dataset**: If your lab has many orders/patients, use the search and filter features to limit results.
- **API cold start**: If using Vercel serverless for the API, the first request after inactivity may be slow (cold start).

### API timeouts

- Check the **health endpoint**: `GET <API_URL>/health`.
- **Supabase**: Verify your database isn't throttled (check Supabase dashboard for connection limits and storage usage).
- **Rate limiting**: The API allows 100 requests/minute per IP. If rate-limited, wait and retry.

---

## 9. Deployment & Infrastructure

### Health check returns an error

- Ensure the API is running (`node dist/main.js` or the dev server).
- Check that `DATABASE_URL` and `DIRECT_URL` are set correctly and the database is accessible.

### CORS errors in the browser console

- Set `CORS_ORIGIN` on the API host to include your frontend URL (e.g. `https://labcore-xxx.vercel.app`).
- Avoid using `*` for CORS when credentials are included.

### Database connection errors

- Verify Supabase project is active and not paused (free-tier projects pause after 7 days of inactivity).
- Check that `DATABASE_URL` uses the correct connection string format.
- For Supabase Pooler: append `?pgbouncer=true` to `DATABASE_URL`.

### Vercel build fails

- Ensure the Root Directory in Vercel is set to `packages/web`.
- Verify that `vercel.json` exists in `packages/web`.
- Check that Node.js version is 20+ (set in Vercel project settings).

### Environment variable changes not taking effect

- After changing environment variables on Vercel, you must **redeploy** the project.
- `NEXT_PUBLIC_*` variables are embedded at **build time**, not runtime. A redeploy is always required.

---

*For detailed procedures, see the [Admin Guide](admin-guide.md) and [Deployment Guide](deployment-guide.md).*
