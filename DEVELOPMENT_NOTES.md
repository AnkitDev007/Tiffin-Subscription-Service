# TiffinFlow Development Notes

> **Transparency note:** This is a reconstructed project-development record prepared after implementation. It is not a verbatim AI conversation and must not be submitted in place of a required unedited `AI_LOGS.md` transcript.

## Project brief

### Ankit

I need to build **TiffinFlow**, a full-stack tiffin subscription-management project. A tiffin owner needs to find customers by name or phone, see active and paused subscriptions, and charge each customer only for meals actually delivered. The submission must include a database, REST APIs, registration/login, a usable UI, search, pagination, sorting, a landing page, and clear documentation.

### Development decision

The project will use a deliberately small, dependency-free Node.js stack so it is easy to run and explain in a fourth-year CSE evaluation:

- Browser UI: HTML, CSS and browser JavaScript modules
- Application server: Node.js built-in `http` server
- Persistence: SQLite through Node's built-in `node:sqlite` module
- Authentication: salted `scrypt` password hashes and persisted bearer-token sessions

This keeps the application full-stack while avoiding a complicated installation process. Node.js 24 or later is required because it provides `node:sqlite`.

## Data and billing model

### Ankit

How should the database represent the business while keeping the scope manageable?

### Development decision

The SQLite schema has five related tables:

| Table | Purpose |
| --- | --- |
| `users` | Owner accounts, emails and password hashes |
| `sessions` | Bearer tokens with expiry times |
| `customers` | Subscriber details, plan label, monthly price and current status |
| `deliveries` | One confirmed delivery per customer and delivery date |
| `pause_windows` | Reserved schema for recording future pause-period history |

`deliveries` is the source of truth for billing. Recording confirmed deliveries makes the invoice calculation auditable and avoids charging a customer merely because their subscription was active. The current pause/resume action updates the customer’s current `active`/`paused` state; `pause_windows` is retained for the next iteration that captures pause dates and reasons.

The invoice formula is:

```text
invoice = round(monthly plan price / scheduled service days × confirmed delivery days)
```

For the dashboard seed data, a service month is set to 22 service days. The application therefore pro-rates a ₹3,000 plan with 17 confirmed meals rather than charging the full monthly amount.

## API and authentication

### Ankit

What endpoints should the working interface use?

### Development decision

The implemented REST API is intentionally limited to the operations required by the UI:

| Method | Endpoint | Function |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Creates an owner account and session |
| `POST` | `/api/auth/login` | Validates credentials and returns a bearer token |
| `GET` | `/api/dashboard` | Returns active, paused, delivery and collection metrics |
| `GET` | `/api/customers?q=&page=&limit=&sort=&order=` | Searches, sorts and paginates subscribers |
| `POST` | `/api/customers` | Adds a subscriber |
| `PATCH` | `/api/customers/:id/status` | Pauses or resumes a subscriber |

Passwords are never stored in plain text. Login and registration create a persisted session token, and the dashboard/customer endpoints require `Authorization: Bearer <token>`.

## UI design

### Ankit

I want it to feel like an operations product, not only a CRUD table.

### Development decision

The app has three browser views:

1. **Landing page** — explains what TiffinFlow is, the target audience, features, the benefit of fair billing, and the next three planned features.
2. **Login and registration page** — provides the mandatory account flow before a dashboard can be used.
3. **Owner dashboard** — shows active subscriptions, paused subscriptions, total confirmed deliveries, and projected collection. It provides customer search by name or phone, sorting, pagination, add-subscriber, and pause/resume controls.

The landing-page roadmap is deliberately tied to the domain: customer self-service pauses, delivery-route optimisation, and UPI invoice/reconciliation.

## Search, sorting and pagination

### Ankit

Should the dashboard load all customers and filter them in the browser?

### Development decision

No. Search, pagination and sorting run on the server through `GET /api/customers`. The API accepts:

```text
q       name or phone search text
page    requested page number
limit   page size
sort    name, plan, monthly_price, or status
order   asc or desc
```

The response returns only the requested records plus the total count. This keeps the browser interface simple and demonstrates that the REST layer, not just the UI, supports scalable retrieval.

## Validation and correction

### Ankit

What did we verify before preparing the repository?

### Development record

- Ran `npm test` to verify the delivery-aware invoice calculation.
- Ran JavaScript syntax checks on the server and browser modules.
- Started the application with `npm start`.
- Logged in with the seeded demo owner account.
- Called authenticated dashboard and customer-search endpoints locally.
- Confirmed search returns the matching subscriber with pagination metadata.
- Reviewed the dashboard query and corrected its aggregation so projected collection is calculated once per customer rather than once per joined delivery row.
- Confirmed the README lists setup, demo credentials and every implemented endpoint.

## Submission checklist

### Ankit

What is in the public repository now?

### Development record

The repository contains the runnable full-stack source, `README.md`, `REASONING.md`, database design documentation, tests, and a static visual prototype in `dist/`. The runtime SQLite file is generated locally at `data/tiffinflow.db` and intentionally ignored by Git so user and session data are not committed.

The remaining submission artifact, if the evaluator explicitly requires it, is the genuine untouched conversation export in `AI_LOGS.md`.
