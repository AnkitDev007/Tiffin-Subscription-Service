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

## Suggested academic extension

Add customer self-service pauses, delivery-route optimization, and UPI invoice reconciliation. A production deployment can move the same schema to PostgreSQL and add role-based access for owners, delivery staff and customers.
