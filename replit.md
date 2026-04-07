# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Recharts

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Project: Quản lý Chăm sóc Khách hàng (CRM) - Version 5.0

A full-stack Vietnamese CRM web application for managing customer relationships, orders, and inventory.

### Artifacts

- `artifacts/api-server` — Express REST API server (port 8080)
- `artifacts/crm` — React + Vite CRM frontend (port 22444)
- `artifacts/mockup-sandbox` — Component preview server (port 8081)

### Shared Libraries

- `lib/db` — Drizzle ORM schema and database client
- `lib/api-spec` — OpenAPI 3.0 specification
- `lib/api-zod` — Generated Zod schemas from OpenAPI spec
- `lib/api-client-react` — Generated React Query hooks from OpenAPI spec

### Database Schema

Tables:
- `employees` — CRM users/staff
- `customer_statuses` — Configurable customer status stages with colors and sort order
- `customer_sources` — Lead sources (Facebook, Website, etc.)
- `product_types` — Categories of products/services
- `supply_sources` — Suppliers/vendors
- `products` — Inventory items with quantity and pricing
- `customers` — Customer records with status, employee assignment, source
- `orders` — Order records linked to customers with revenue, profit, warranty tracking

### CRM Features

#### Khách hàng (Customer Tab)
- Customer table with pagination (10/20/50 per page)
- Filters: status, employee, need follow-up checkbox
- Customer code format: "KH1 - Name"
- Full CRUD: add/edit modal with order info, delete
- Revenue/profit displayed in blue-purple (#6366f1)

#### Báo cáo (Reports Tab)
- Date range filter for revenue/profit
- 8 stat cards (profit, warranty risk, inventory capital, etc.)
- Multiple Recharts charts: pie, bar, line, area, composed
- Customer distribution by status, employee, source
- Monthly trends, top customers, warranty tracking tables

#### Vận hành (Operations Tab)
- Today stats: revenue, orders, profit
- 7-day sales trend chart
- Sub-tabs for future features

#### Cài đặt (Settings Tab)
- Employee management (CRUD)
- Customer status management with drag reorder
- Customer source management
- Product type management
- Supply source management

### API Routes

```
GET/POST    /api/employees
PUT/DELETE  /api/employees/:id

GET/POST    /api/customer-statuses
PUT/DELETE  /api/customer-statuses/:id
POST        /api/customer-statuses/reorder

GET/POST    /api/customer-sources
PUT/DELETE  /api/customer-sources/:id

GET/POST    /api/product-types
PUT/DELETE  /api/product-types/:id

GET/POST    /api/supply-sources
PUT/DELETE  /api/supply-sources/:id

GET/POST    /api/products
PUT/DELETE  /api/products/:id

GET/POST    /api/customers
GET/PUT/DELETE /api/customers/:id

GET         /api/reports/summary
GET         /api/reports/status-distribution
GET         /api/reports/customers-by-employee
GET         /api/reports/daily-trend
GET         /api/reports/customers-by-source
GET         /api/reports/top-sales
GET         /api/reports/monthly-trend
GET         /api/reports/monthly-profit
GET         /api/reports/top-customers
GET         /api/reports/revenue-by-source
GET         /api/reports/revenue-by-employee
GET         /api/reports/expiring-warranties
GET         /api/reports/expired-warranties

GET         /api/operations/today
GET         /api/operations/sales-trend
GET         /api/operations/inventory-summary
```

### Sample Data

24 customers seeded with realistic Vietnamese names, orders, and warranty info. Employees: Administrator, Ngô Lập Sơn, Laptop Ánh Dương. 9 customer statuses, 7 sources, 11 product types, 11 supply sources.
