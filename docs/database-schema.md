# Data model

| Entity | Purpose | Key fields |
|---|---|---|
| Customer | Person receiving meals | customer_id, name, phone |
| Subscription | Selected tiffin plan | plan, monthly_price, status |
| PauseWindow | Days a service is stopped | start_date, end_date, reason |
| Delivery | Confirmed meal service | delivery_date, customer_id, delivered |
| Invoice | Monthly financial record | month, billed_days, amount |

The prototype keeps these records in a JSON repository to make the project runnable without database installation. The model maps directly to relational tables for PostgreSQL or MySQL.
