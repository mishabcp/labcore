# LabCore LIMS — API Documentation

**Version**: 1.0 · **Base URL**: `http://localhost:3001` (dev) or your production API URL · **Last Updated**: February 2026

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Common Conventions](#2-common-conventions)
3. [Auth](#3-auth)
4. [Patients](#4-patients)
5. [Orders](#5-orders)
6. [Samples](#6-samples)
7. [Results](#7-results)
8. [Reports](#8-reports)
9. [Public Reports](#9-public-reports)
10. [Invoices](#10-invoices)
11. [Tests (Test Master)](#11-tests-test-master)
12. [Rate Cards](#12-rate-cards)
13. [Users](#13-users)
14. [Settings](#14-settings)
15. [Dashboard](#15-dashboard)
16. [Audit Logs](#16-audit-logs)
17. [Health](#17-health)

---

## 1. Authentication

LabCore uses **JWT-based authentication**. After a successful login, you receive an `accessToken` and a `refreshToken`.

**Include the access token in every authenticated request:**

```
Authorization: Bearer <accessToken>
```

- **Access token** expires in 1 hour.
- **Refresh token** expires in 7 days. Use it to obtain a new access token.

---

## 2. Common Conventions

### Request Format

- Content type: `application/json` (unless uploading files — use `multipart/form-data`)
- All IDs are UUIDs

### Response Format

- Successful responses return the resource or array of resources as JSON.
- Errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Standard Status Codes

| Code | Meaning              |
|------|----------------------|
| 200  | Success              |
| 201  | Created              |
| 400  | Bad Request          |
| 401  | Unauthorized         |
| 403  | Forbidden (role)     |
| 404  | Not Found            |
| 500  | Internal Server Error|

### Role-Based Access

Endpoints are protected by roles. If your role is insufficient, you receive HTTP 403. Roles are hierarchical: Admin > Pathologist > Senior Technician > Technician > Front Desk.

---

## 3. Auth

| Method | Endpoint              | Auth  | Description                           |
|--------|-----------------------|-------|---------------------------------------|
| POST   | `/auth/register-lab`  | No    | Register a new lab and admin user     |
| POST   | `/auth/login`         | No    | Log in with mobile + password         |
| POST   | `/auth/refresh`       | No    | Refresh access token                  |
| GET    | `/auth/me`            | Yes   | Get current user profile              |
| PATCH  | `/auth/language`      | Yes   | Update language preference            |

### POST `/auth/register-lab`

**Body:**
```json
{
  "labName": "City Diagnostics",
  "labSlug": "city-diagnostics",
  "adminName": "Dr. Kumar",
  "mobile": "9876543210",
  "password": "SecurePass1"
}
```

**Returns:** `{ accessToken, refreshToken, user }`

### POST `/auth/login`

**Body:**
```json
{
  "mobile": "9876543210",
  "password": "SecurePass1"
}
```

**Returns:** `{ accessToken, refreshToken, user }`

### POST `/auth/refresh`

**Body:**
```json
{
  "refreshToken": "<refresh-token>"
}
```

**Returns:** `{ accessToken, refreshToken, user }`

### GET `/auth/me`

**Returns:** `{ id, name, email, mobile, role, labId, labName, languagePref }`

### PATCH `/auth/language`

**Body:** `{ "languagePref": "en" | "ml" }`

**Returns:** `{ success: true }`

---

## 4. Patients

All endpoints require authentication.

| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| POST   | `/patients`        | Create a new patient     |
| GET    | `/patients`        | List / search patients   |
| GET    | `/patients/:id`    | Get patient by ID        |

### POST `/patients`

**Body:**
```json
{
  "name": "Ravi Menon",
  "age": 45,
  "gender": "male",
  "mobile": "9876543210",
  "email": "ravi@example.com",
  "address": "Kochi, Kerala"
}
```

### GET `/patients`

**Query params:** `search` (string), `limit` (number)

### GET `/patients/:id`

**Returns:** Full patient record including order history.

---

## 5. Orders

All endpoints require authentication. Cancel endpoints require Admin, Pathologist, or Front Desk role.

| Method | Endpoint                                  | Roles           | Description                    |
|--------|-------------------------------------------|-----------------|--------------------------------|
| POST   | `/orders`                                 | All             | Create a new order             |
| GET    | `/orders`                                 | All             | List orders                    |
| GET    | `/orders/:id`                             | All             | Get order details              |
| PATCH  | `/orders/:id/cancel`                      | Admin/Path/FD   | Cancel an order                |
| PATCH  | `/orders/:id/add-items`                   | All             | Add tests to an existing order |
| PATCH  | `/orders/:orderId/items/:itemId/cancel`   | Admin/Path/FD   | Cancel a single order item     |

### POST `/orders`

**Body:**
```json
{
  "patientId": "<uuid>",
  "testDefinitionIds": ["<uuid>", "<uuid>"],
  "priority": "routine",
  "discountPercent": 10,
  "referringDoctorId": "<uuid>",
  "rateCardId": "<uuid>"
}
```

### PATCH `/orders/:id/cancel`

**Body:** `{ "cancelReason": "Patient request" }`

### PATCH `/orders/:id/add-items`

**Body:** `{ "testDefinitionIds": ["<uuid>"] }`

---

## 6. Samples

All endpoints require authentication.

| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/samples`                  | List samples (with filters)    |
| GET    | `/samples/dashboard-counts` | Get counts by status           |
| GET    | `/samples/:id`              | Get sample details             |
| PATCH  | `/samples/:id/status`       | Update sample status           |

### GET `/samples`

**Query params:** `status` (ordered/collected/received/in_process/completed/rejected), `search` (string), `limit` (number)

### PATCH `/samples/:id/status`

**Body:**
```json
{
  "status": "collected",
  "rejectionReason": "Hemolyzed"
}
```

`rejectionReason` is required only when status is `rejected`.

---

## 7. Results

All endpoints require authentication.

| Method | Endpoint              | Description                     |
|--------|-----------------------|---------------------------------|
| GET    | `/results`            | Results worklist (with filters) |
| GET    | `/results/:id`        | Get result details              |
| PATCH  | `/results/:id/values` | Submit result values            |
| PATCH  | `/results/:id/status` | Update result status            |

### GET `/results`

**Query params:** `status` (pending/entered/reviewed/authorised), `limit` (number)

### PATCH `/results/:id/values`

**Body:**
```json
{
  "values": [
    {
      "testParameterId": "<uuid>",
      "value": "12.5",
      "flag": "H"
    }
  ]
}
```

### PATCH `/results/:id/status`

**Body:**
```json
{
  "status": "authorised",
  "rejectionComment": "Recheck values",
  "interpretiveNotes": "Normal findings"
}
```

---

## 8. Reports

All endpoints require authentication. Amend requires Admin or Pathologist role.

| Method | Endpoint                              | Roles         | Description                    |
|--------|---------------------------------------|---------------|--------------------------------|
| GET    | `/reports`                            | All           | List all reports               |
| GET    | `/reports/:id`                        | All           | Get report details             |
| POST   | `/reports/orders/:orderId/generate`   | All           | Generate report for an order   |
| GET    | `/reports/:id/pdf`                    | All           | Download/stream PDF            |
| GET    | `/reports/:id/share-url`              | All           | Get shareable URL              |
| POST   | `/reports/:id/mark-shared`            | All           | Log report delivery            |
| POST   | `/reports/:id/amend`                  | Admin/Path    | Amend an authorised report     |
| POST   | `/reports/bulk-download`              | All           | Download multiple reports (ZIP)|

### POST `/reports/:id/mark-shared`

**Body:**
```json
{
  "channel": "whatsapp",
  "recipientContact": "9876543210"
}
```

Channel values: `whatsapp`, `email`, `portal`, `print`

### POST `/reports/:id/amend`

**Body:** `{ "reason": "Corrected reference range" }`

### POST `/reports/bulk-download`

**Body:** `{ "reportIds": ["<uuid>", "<uuid>"] }`

**Returns:** ZIP file (`application/zip`)

---

## 9. Public Reports

**No authentication required.** These endpoints are used for report verification via QR codes.

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/public/reports/verify/:code`    | Verify a report by its code    |
| GET    | `/public/reports/verify/:code/pdf`| Download verified report PDF   |

---

## 10. Invoices

All endpoints require authentication.

| Method | Endpoint                          | Description                     |
|--------|-----------------------------------|---------------------------------|
| GET    | `/invoices`                       | List all invoices               |
| GET    | `/invoices/daily-summary`         | Get daily payment summary       |
| GET    | `/invoices/by-order/:orderId`     | Get invoice for an order        |
| GET    | `/invoices/:id`                   | Get invoice details             |
| POST   | `/invoices/:id/payments`          | Record a payment                |

### GET `/invoices/daily-summary`

**Query params:** `date` (YYYY-MM-DD, defaults to today)

### POST `/invoices/:id/payments`

**Body:**
```json
{
  "amount": 500,
  "mode": "upi",
  "transactionRef": "TXN123"
}
```

Mode values: `cash`, `upi`, `card`, `net_banking`, `cheque`, `other`

---

## 11. Tests (Test Master)

All endpoints require authentication. Mutations require Admin or Pathologist role. Deactivate requires Admin.

| Method | Endpoint                           | Roles         | Description                  |
|--------|------------------------------------|---------------|------------------------------|
| GET    | `/tests`                           | All           | List tests (search, panels)  |
| GET    | `/tests/:id`                       | All           | Get test definition          |
| POST   | `/tests`                           | Admin/Path    | Create a test                |
| PATCH  | `/tests/:id`                       | Admin/Path    | Update a test                |
| PATCH  | `/tests/:id/deactivate`            | Admin         | Deactivate a test            |
| POST   | `/tests/:id/parameters`            | Admin/Path    | Add a parameter to a test    |
| PATCH  | `/tests/:id/parameters/:paramId`   | Admin/Path    | Update a parameter           |

### GET `/tests`

**Query params:** `search` (string), `panel` ("true" to list only panels)

---

## 12. Rate Cards

All endpoints require authentication. Mutations require Admin role.

| Method | Endpoint                 | Roles  | Description                    |
|--------|--------------------------|--------|--------------------------------|
| GET    | `/rate-cards`            | All    | List rate cards                |
| GET    | `/rate-cards/:id`        | All    | Get rate card with items       |
| POST   | `/rate-cards`            | Admin  | Create a rate card             |
| PATCH  | `/rate-cards/:id`        | Admin  | Update a rate card             |
| POST   | `/rate-cards/:id/items`  | Admin  | Add/update item in rate card   |
| DELETE | `/rate-cards/:id`        | Admin  | Deactivate a rate card         |

---

## 13. Users

All endpoints require authentication. **Admin role required for all user management.**

| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/users`                    | List all users in the lab      |
| POST   | `/users`                    | Create a new user              |
| PATCH  | `/users/:id`                | Update user details            |
| POST   | `/users/:id/reset-password` | Reset a user's password        |
| PATCH  | `/users/:id/deactivate`     | Deactivate a user              |

### POST `/users`

**Body:**
```json
{
  "name": "Anita K",
  "mobile": "9876543211",
  "password": "SecurePass1",
  "role": "technician",
  "email": "anita@lab.com",
  "qualification": "B.Sc MLT",
  "registrationNo": "KL-1234"
}
```

Role values: `admin`, `pathologist`, `senior_technician`, `technician`, `front_desk`

---

## 14. Settings

All endpoints require authentication. Mutations require Admin role.

| Method | Endpoint                | Roles  | Description                    |
|--------|-------------------------|--------|--------------------------------|
| GET    | `/settings/lab`         | All    | Get lab settings               |
| PATCH  | `/settings/lab`         | Admin  | Update lab settings            |
| POST   | `/settings/lab/logo`    | Admin  | Upload lab logo (multipart)    |
| POST   | `/settings/lab/signature`| Admin | Upload pathologist signature   |

### POST `/settings/lab/logo`

**Content-Type:** `multipart/form-data`
**Field:** `file` (PNG or JPG)

### POST `/settings/lab/signature`

**Content-Type:** `multipart/form-data`
**Field:** `file` (PNG, transparent background recommended)

---

## 15. Dashboard

All endpoints require authentication.

| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| GET    | `/dashboard/stats`  | Today's key metrics            |
| GET    | `/dashboard/tat`    | Turnaround time metrics        |
| GET    | `/dashboard/trends` | Historical trends (30 days)    |

### GET `/dashboard/stats` — Response shape

```json
{
  "todayPatients": 12,
  "todayOrders": 15,
  "todayReports": 8,
  "todayReportsDelivered": 6,
  "resultsPendingAuth": 3,
  "todayRevenue": 12500,
  "thisWeekRevenue": 45000,
  "thisMonthRevenue": 185000,
  "revenueByMode": { "cash": 5000, "upi": 7500 },
  "pendingSamples": 4,
  "avgTatHours": 6.2
}
```

---

## 16. Audit Logs

All endpoints require authentication. **Admin role required.**

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/audit-logs`         | List audit log entries         |
| GET    | `/audit-logs/export`  | Export audit logs as CSV       |

### GET `/audit-logs`

**Query params (all optional):**

| Param       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `entityType`| string | Filter by entity (patient, order, etc.)|
| `entityId`  | string | Filter by specific entity ID         |
| `userId`    | string | Filter by user ID                    |
| `from`      | string | Start date (ISO 8601)                |
| `to`        | string | End date (ISO 8601)                  |
| `limit`     | number | Max entries (default: 50)            |
| `cursor`    | string | Pagination cursor                    |

### GET `/audit-logs/export`

Same query params as above (limit defaults to 5000). Returns CSV file download.

---

## 17. Health

**No authentication required.**

| Method | Endpoint   | Description             |
|--------|------------|-------------------------|
| GET    | `/health`  | API health check        |

**Returns:** HTTP 200 if the API and database are healthy.

---

*For user workflows, see the [User Manual](user-manual.md).*
*For deployment, see the [Deployment Guide](deployment-guide.md).*
