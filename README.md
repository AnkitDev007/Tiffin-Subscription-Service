# TiffinFlow — Delivery-Aware Tiffin Management

A fourth-year CSE project for operating a subscription tiffin service. It models customers, subscriptions, delivery counts, pause/resume states, and delivery-aware monthly invoices.

## Core idea

For a billing month, the payable amount is:

`monthly plan price / scheduled service days × confirmed delivery days`

This makes pausing fair: paused days never become chargeable days.

## Project structure

```text
client/       browser dashboard (HTML, CSS, JavaScript)
server/       Node.js REST API and billing rules
data/         development data repository
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

## Run locally

```bash
npm start
```

Open `http://localhost:3000`. Run the automated business-rule test with `npm test`.

## Suggested academic extension

Replace the JSON development repository with PostgreSQL. Model `Customer`, `Subscription`, `PauseWindow`, `Delivery`, and `Invoice` as separate tables; then generate invoices from confirmed delivery records. Add login roles for owner, delivery staff, and customer.
