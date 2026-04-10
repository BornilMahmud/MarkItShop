# MarkitShop Advanced DBMS Package

This folder upgrades the base e-commerce repository into a university-ready DBMS case study for **MarkitShop Advanced DBMS System**.

## Included deliverables

- `normalized-schema.sql`
  Relational schema normalized up to 3NF with inventory, payments, reviews, audit logs, warehouse facts, views, triggers, procedures, and transaction examples.
- `markitshop.prisma`
  Prisma representation of the extended data model for application-facing services.

## DBMS coverage

- Normalization: 1NF, 2NF, 3NF
- JOIN-ready transactional schema
- Transactions with `COMMIT` / `ROLLBACK`
- Stored procedures
- Triggers
- Views for reporting and security-friendly reads
- Role-based security design
- MongoDB integration concept for product events and behavioral logs
- Data warehouse star schema
- Distributed database concept for regional scaling

## MongoDB integration concept

Use MongoDB for semi-structured and high-volume operational data that does not fit cleanly into the transactional MySQL core:

- `product_activity_logs`
  Stores product views, cart events, wishlist events, and session metadata.
- `search_analytics`
  Stores user search text, result counts, click-through choices, and faceted filter selections.
- `notification_delivery`
  Stores notification payload traces and retry attempts.

The relational database remains the source of truth for orders, products, payments, users, inventory, and reporting snapshots.

## Distributed database concept

- Dhaka primary node
  Handles checkout, order writes, payment confirmations, and admin updates.
- Regional read replicas
  Serve product browsing, analytics reads, and customer order-history queries.
- Nightly ETL
  Loads transactional data into the warehouse for monthly sales and user-growth reporting.

## How this connects to the app

- The Next.js storefront and admin dashboard continue to use the existing UI system.
- The Express backend now exposes analytics and order-history APIs from the live transactional tables.
- The SQL package documents the deeper DBMS features required for the final exam without forcing an unsafe live migration during UI work.
