# Architecture

```text
Browser client â†’ REST API (Node.js) â†’ JSON repository
                  â”œâ”€â”€ customer subscriptions
                  â”œâ”€â”€ delivery counts
                  â””â”€â”€ pro-rated invoice calculation
```

The client never calculates an invoice itself. The API calculates `monthly plan price / service days Ã— delivered days`, which prevents pause days from being billed. For a production deployment, replace `data/db.json` with PostgreSQL and preserve the same API contract.

## Modules

- `client/`: accessible dashboard UI and API calls
- `server/`: HTTP routes and billing business logic
- `data/`: development seed data
- `tests/`: automated billing-rule test
- `docs/`: architecture and design evidence for viva/project report
