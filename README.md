# TiffinFlow — Delivery-Aware Tiffin Management

A fourth-year CSE project for operating a subscription tiffin service. It models customers, subscriptions, delivery counts, pause/resume states, and delivery-aware monthly invoices.

## Core idea

For a billing month, the payable amount is:

`monthly plan price / scheduled service days × confirmed delivery days`

This makes pausing fair: paused days never become chargeable days.

## Mandatory evaluation checklist

- Real persistence: SQLite database generated at `data/tiffinflow.db` from a relational schema.
- REST API: authenticated core operations listed below.
- Usable UI: landing page, registration/login, dashboard, search, sorting and pagination.
- Root documents: `README.md`, `REASONING.md`, and the required unedited `AI_LOGS.md` transcript.

## Project structure

```text
client/       browser dashboard (HTML, CSS, JavaScript)
server/       Node.js REST API, authentication and SQLite access
data/         generated SQLite database (not committed)
tests/        automated business-rule tests
docs/         architecture and database design for report/viva
dist/         standalone static demo for deployment
```

## Features

- Interactive subscriber dashboard with active and paused filters
- Phone/name lookup
- Pause/resume state changes with local persistence
- Add-subscriber workflow
- Delivery volume and billing readiness dashboard
- Responsive interface for operations staff
- Weekday delivery-notification outbox for Notification Service integration
- Mid-cycle subscription transfer with carried plan/cycle and a billing split
- Messy customer-list import with imported, deduped and rejected-row reporting

## Setup and run

```bash
npm start
```

Open `http://localhost:3000`. Use the seeded demo account: `owner@tiffinflow.test` / `Demo@123`. Run the automated business-rule test with `npm test`.

## REST API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user account |
| POST | `/api/auth/login` | Sign in and receive a bearer token |
| GET | `/api/dashboard` | Read authenticated dashboard metrics |
| GET | `/api/customers?q=&page=&limit=&sort=&order=` | Search, sort and paginate subscribers |
| POST | `/api/customers` | Create a subscriber subscription |
| PATCH | `/api/customers/:id/status` | Pause or resume a subscription |
| POST | `/clock` | Queue weekday delivery-due notifications for active customers |
| GET | `/outbox?date=YYYY-MM-DD` | Inspect notifications queued for Notification Service |
| POST | `/api/subscriptions/:id/transfer` | Transfer plan/cycle to a new customer and return the billing split |
| POST | `/api/import/customers` | Import messy customer rows and return imported/deduped/rejected report |

## Twist scenarios

`POST /clock` accepts an optional `{ "date": "2026-09-17" }` body. On a weekday it adds exactly one `delivery_due` outbox event per active customer; repeat calls are idempotent and weekends queue no messages. `GET /outbox` is intentionally available without login so an evaluation harness can inspect the integration result.

To transfer a subscription, send `{ "name": "New customer", "phone": "9876543210", "effectiveDate": "2026-09-17" }` to `POST /api/subscriptions/:id/transfer`. The new customer inherits the plan and price; confirmed delivery records keep the previous customer's bill separate.

For data cleanup, send `{ "rows": [...] }` to `POST /api/import/customers`. Phone numbers are normalized before duplicate detection, common `DD/MM/YYYY` and ISO date formats are cleaned, blank start dates default to today, and the result contains `imported`, `deduped`, and `rejected` arrays.

## Suggested academic extension

Add customer self-service pauses, delivery-route optimization, and UPI invoice reconciliation. A production deployment can move the same schema to PostgreSQL and add role-based access for owners, delivery staff and customers.
