# TiffinFlow

A fourth-year CSE project prototype for operating a subscription tiffin service. It implements customer phone search, active/paused visibility, pause/resume controls, delivery reporting, and billing based on delivered service days.

## Core idea

For a billing month, the payable amount is:

`monthly plan price / scheduled service days × confirmed delivery days`

Paused days never become chargeable days.

## Features

- Interactive subscriber dashboard with active and paused filters
- Phone/name lookup
- Pause/resume state changes with local persistence
- Add-subscriber workflow
- Delivery volume and billing readiness dashboard
- Responsive operations interface

## Run locally

Open `dist/index.html` in a modern browser. No server or package installation is required.

## Suggested academic extension

Replace browser storage with a Node/Express API and PostgreSQL. Model Customer, Subscription, PauseWindow, Delivery, and Invoice as separate tables; then generate invoices from confirmed delivery records.
