# Reasoning and validation

## Design decisions

The critical domain rule is fairness: an invoice must use confirmed deliveries, not the number of calendar days in a subscription. SQLite was selected because it provides real durable persistence with a relational schema while keeping setup suitable for a student demonstration. Passwords are salted and hashed with Node's `scrypt` function; browser requests use a short-lived bearer token stored in the database.

The repository separates landing, authentication, dashboard UI, REST API, data access and test code so the layers can be evaluated independently. Search, sorting and server-side pagination are part of the customer-list endpoint, rather than only client-side display tricks.

## Validation completed

- Tested the pro-rated billing rule: ₹3,000 ÷ 22 service days × 17 delivered days = ₹2,318.
- Started the application and verified dashboard and filtered-customer API responses.
- Checked client JavaScript syntax and exercised pause/resume state changes in the earlier dashboard prototype.
- Identified and corrected UTF-8 document encoding while preparing the repository.

## Known limitations / next work

The demo uses a seeded owner account and a token session suited to local demonstration. A production deployment should add HTTPS-only cookies, rate limiting, CSRF protection, audit logs and a managed PostgreSQL database.
