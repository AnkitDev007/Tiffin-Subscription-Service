# Architecture

```text
Browser client → REST API (Node.js) → JSON repository
                  ├── customer subscriptions
                  ├── delivery counts
                  └── pro-rated invoice calculation
```

The client never calculates an invoice itself. The API calculates `monthly plan price / service days × delivered days`, which prevents pause days from being billed. For a production deployment, replace `data/db.json` with PostgreSQL and preserve the same API contract.

## Modules

- `client/`: accessible dashboard UI and API calls
- `server/`: HTTP routes and billing business logic
- `data/`: development seed data
- `tests/`: automated billing-rule test
- `docs/`: architecture and design evidence for viva/project report
