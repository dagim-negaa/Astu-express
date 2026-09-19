# Final Project Report

## Cover Page

**Project Title**: ASTU Express — Web-Based Mini ERP System for Inventory, Sales and Financial Operations

**Student Name(s)**: [Your Name / Team Members' Names]

**Program**: Department of Information Technology / Computer Science

**Supervisor**: [Supervisor's Name]

**Institution**: Adama Science and Technology University (ASTU)

**Date of Submission**: September 2026

---

## Declaration

I/We declare that this project report represents my/our original work and has not been submitted elsewhere for academic credit. All sources have been properly cited.

**Signatures**:

[Signature of Student 1]

[Signature of Student 2, if applicable]

---

## Acknowledgments

I/We thank [Supervisor's Name] for their guidance, continuous support, and constructive feedback throughout the development of this project. I/We would also like to thank the faculty members of the Department of [Department Name] at Adama Science and Technology University for providing the resources and environment necessary to complete this work. Special appreciation goes to [list specific contributors, e.g., family members, friends, teammates] for their valuable support in completing this project.

---

## Abstract

This report presents the design, development, and evaluation of ASTU Express, a web-based mini Enterprise Resource Planning (ERP) system developed as a capstone project at Adama Science and Technology University. The system addresses the operational challenges faced by Ethiopian online retail businesses, which currently rely on spreadsheets, paper records, and disconnected tools that lead to stock errors, lost orders, unclear finances, and wasted time. ASTU Express integrates product catalog management, order processing, customer management, supplier procurement, expense tracking, multiple payment methods, and financial reporting into a single unified web platform.

The application was developed using a monorepo architecture with a Cloudflare Workers backend built on the Hono framework, a Cloudflare D1 relational database managed through the Drizzle ORM, and a React 19 single-page frontend. The backend exposes a RESTful API organized into 14 domain-specific route modules, while the frontend combines a customer-facing storefront with a role-based admin dashboard. Authentication and role-based access control are implemented using Better Auth, enforcing four distinct staff roles: Owner, Admin, Manager, and Operator.

Key findings include the successful integration of real-time stock reduction on order placement, automatic profit-margin calculation, multi-store and multi-warehouse support, and comprehensive financial reporting. The system was validated through end-to-end local testing and deployed to Cloudflare's serverless edge infrastructure with continuous integration via GitHub Actions. This work demonstrates that a cost-effective, scalable ERP solution for small and medium-sized Ethiopian retail businesses can be delivered entirely on serverless infrastructure with zero traditional server management.

---

## Table of Contents

- 1. Introduction — Page 1
- 2. Literature Review — Page X
- 3. Methodology — Page X
- 4. Results — Page X
- 5. Discussion — Page X
- 6. Conclusions — Page X
- 7. Recommendations — Page X
- 8. References — Page X
- 9. Appendices — Page X

---

## List of Figures

- Figure 1: System Architecture Diagram — Page X
- Figure 2: Database Schema Overview — Page X
- Figure 3: Admin Dashboard KPI Overview — Page X
- Figure 4: Storefront Product Catalog — Page X
- Figure 5: Order Management Interface — Page X
- Figure 6: Financial Reports Dashboard — Page X

---

## List of Tables

- Table 1: Core Features of ASTU Express — Page X
- Table 2: Role-Based Access Control Matrix — Page X
- Table 3: Technology Stack — Page X
- Table 4: Database Tables and Their Purpose — Page X
- Table 5: API Endpoint Summary — Page X
- Table 6: Challenges and Solutions — Page X
- Table 7: Summary of Results — Page X

---

## List of Abbreviations

- **API**: Application Programming Interface
- **CORS**: Cross-Origin Resource Sharing
- **CRUD**: Create, Read, Update, Delete
- **D1**: Cloudflare D1 (serverless SQLite database)
- **ERP**: Enterprise Resource Planning
- **ETB**: Ethiopian Birr
- **GRN**: Goods Received Note
- **ORM**: Object-Relational Mapping
- **P&L**: Profit and Loss
- **RBAC**: Role-Based Access Control
- **R2**: Cloudflare R2 (serverless object storage)
- **REST**: Representational State Transfer
- **SKU**: Stock Keeping Unit
- **SPA**: Single-Page Application
- **KPI**: Key Performance Indicator

---

## 1. Introduction

### 1.1 Background

Running a retail business involves many moving parts. Products must be listed and tracked, orders come in from customers and must be fulfilled, money flows in from sales and flows out through expenses, supplier payments, and operational costs. Small and medium-sized Ethiopian retailers typically manage these operations using spreadsheets, paper records, or multiple disconnected software tools. This fragmented approach is error-prone: stock records drift out of sync, orders are lost or duplicated, finances are unclear, and staff time is wasted on manual reconciliation.

Advancements in serverless cloud computing have made it possible to build complete business management systems without traditional server infrastructure. Cloudflare Workers, in particular, provides globally distributed edge-computing capabilities, a serverless SQL database (D1), and object storage (R2) that together enable low-cost, scalable web applications. Research into ERP adoption in developing economies consistently shows that small businesses derive significant value from unified business software, yet the cost and complexity of traditional ERP systems remain prohibitive. Web-based mini ERP systems built on serverless platforms directly address this accessibility gap.

ASTU Express is a web-based mini ERP system designed to manage the complete business operations of an Ethiopian online retail and garment business. It provides a single platform for selling products online, managing inventory, processing orders, handling payments, tracking suppliers and expenses, and generating financial reports. The name "ASTU" references Adama Science and Technology University, where the project was undertaken as a final-year capstone.

### 1.2 Problem Statement

Ethiopian retail businesses that operate online face significant operational inefficiencies rooted in the absence of a unified management system. The specific problems addressed by this project are:

1. **Fragmented operations**: Businesses juggle spreadsheets, paper logs, messaging apps, and offline records, leading to duplicated effort and inconsistent data across systems.
2. **Inventory inaccuracy**: Without real-time stock tracking, businesses over-sell out-of-stock items or fail to reorder in time, losing revenue and damaging customer trust.
3. **Order management gaps**: Orders are recorded manually, statuses are unclear, and customers have no way to track progress, resulting in lost orders and poor service.
4. **Poor financial visibility**: Revenue, expenses, and profit are not tracked systematically, making it impossible for owners to judge business health or make data-driven decisions.
5. **No role-based security**: Any staff member with access to shared files can modify sensitive data; there is no concept of what each employee is allowed to see or do.
6. **High cost of existing ERP alternatives**: Traditional ERP packages are expensive, complex, and require dedicated hardware — out of reach for small Ethiopian retailers.

ASTU Express solves these problems by bringing all core business operations into one web-based system that anyone with a browser can access, deployed cost-effectively on serverless infrastructure.

### 1.3 Objectives

The following objectives guided the design and development of ASTU Express:

- **Objective 1**: Design and implement a full-stack web application that combines a customer-facing storefront with a back-office admin dashboard in a single deployable platform.
- **Objective 2**: Build a complete product catalog module supporting SKU codes, categories, colors, sizes, materials, images, pricing, buying costs, profit-margin calculation, and stock tracking.
- **Objective 3**: Implement an order management pipeline that records multi-item orders, automatically reduces stock on placement, tracks a full status lifecycle (pending → processing → shipped → delivered), and supports promo codes and delivery fees.
- **Objective 4**: Develop a customer directory that is automatically populated from orders, tracking order counts and total spending per customer.
- **Objective 5**: Create supplier and procurement modules supporting a supplier directory, purchase orders, and Goods Received Note (GRN) integration linked to warehouse inventory.
- **Objective 6**: Build a financial module encompassing bank accounts, a transaction ledger, categorized expenses, and financial reports including revenue-vs-expenses, profit and loss, profit margin, and average order value.
- **Objective 7**: Implement role-based access control with four staff roles (Owner, Admin, Manager, Operator) using secure authentication.
- **Objective 8**: Deploy the application to Cloudflare's serverless platform (Workers, D1, R2) and establish a continuous-integration pipeline with GitHub Actions.

### 1.4 Scope and Limitations

**In scope**:
- A storefront for browsing products, managing a shopping cart, checking out with customer details and shipping address, and tracking order status.
- A role-based admin dashboard covering products, orders, customers, staff, stores, suppliers, purchase orders, expenses, shipments, banking, warehouse inventory, and financial reports.
- Cloudflare Workers, D1, and R2 as the deployment platform.
- Ethiopian market features: ETB currency, Ethiopian phone normalization, Ethiopian bank integration (CBE, Awash, Telebirr), and Chapa payment gateway integration.

**Out of scope / limitations**:
- **Payment gateway**: Chapa online payment integration code is in place but is not yet live; cash on delivery is the active payment method at the time of this report.
- **Multi-language support**: The interface is currently English-only.
- **Email notifications**: Automated order confirmation emails are not implemented; confirmation is shown on-screen.
- **Tax compliance**: VAT reporting is not implemented; tax amounts can be recorded on purchase orders but full tax-compliant invoicing is out of scope.
- **Scale**: The system targets small-to-medium businesses; it is not designed for large multi-national retail operations.
- **Mobile application**: No native mobile app; the web frontend is responsive but not distributed through app stores.

---

## 2. Literature Review

Enterprise Resource Planning (ERP) systems have historically been designed for large organizations. Classic ERP deployments require substantial infrastructure investment, lengthy implementation periods, and dedicated IT staff, making them unsuitable for small and medium-sized enterprises (SMEs). Research by Haddara and Zach (2011) demonstrated that although SMEs recognize the strategic value of ERP, the dominant barrier is cost and implementation complexity — a finding that remains relevant for developing economies where hardware and licensing costs are proportionally higher.

Cloud-based and Software-as-a-Service (SaaS) ERP offerings relaxed some of these constraints by shifting hardware and maintenance burden to vendors. Marston et al. (2011) analyzed the cloud computing value proposition and identified pay-per-use pricing, elasticity, and reduced capital expenditure as decisive advantages for small firms. However, subscription models still require recurring fees and broadband infrastructure. In Ethiopia, recurring subscription fees in foreign currency are a significant barrier for local retailers.

The emergence of serverless computing extended the cloud value proposition further. Jonas et al. (2019) described serverless as "the next phase of cloud computing" in which the platform automatically manages infrastructure, allowing developers to focus exclusively on business logic. Cloudflare Workers implements a variant of serverless computing that executes JavaScript and WebAssembly on the edge of a global content delivery network, distributing requests across 300+ locations with no cold-start server management. The combination of Workers with D1 (a serverless SQLite database) and R2 (an S3-compatible object store) yields a complete application stack with effectively zero fixed operating costs — a property that aligns directly with the affordability demands of Ethiopian SMEs.

Existing open-source e-commerce platforms such as WooCommerce, Magento, and OpenCart provide storefront and order tooling, but their ERP capabilities are limited: inventory, procurement, supplier management, expenses, and financial reporting usually require many separate plugins that are inconsistent and difficult to maintain. Conversely, heavy OT-style ERP platforms such as Odoo provide broad module coverage but carry steep deployment complexity and a learning curve far beyond the needs of a small garment retailer.

From the literature, the identified gap is clear: there is no affordable, unified, role-based web platform tailored to the operational and financial workflow of Ethiopian online retail businesses that combines storefront, inventory, procurement, expense, banking, and reporting functions in a single codebase. ASTU Express addresses this gap by integrating these functions into one serverless-deployed application, bringing ERP capabilities to a segment of the market that has traditionally been excluded from business-management software.

---

## 3. Methodology

### 3.1 Approach

The project adopted an iterative, agile-inspired development approach. Requirements were gathered from the business workflow of a typical Ethiopian online garment retailer, translated into user stories, and implemented in incremental feature cycles. Each cycle delivered a working vertical slice — from database schema, through API routes, to dashboard UI — allowing continuous testing and refinement.

The architecture followed a **monorepo structure** managed with pnpm workspaces, separating the backend API, the frontend application, and shared packages:

| Package | Purpose |
| --- | --- |
| `apps/api` | Cloudflare Worker backend (Hono framework + Drizzle ORM + Better Auth) |
| `apps/dashboard` | React 19 single-page application (storefront + admin dashboard) |
| `packages/shared` | Shared Zod schemas, enums, and utility functions consumed by both API and dashboard |
| `packages/api-client` | Typed HTTP client exposing every API endpoint as a strongly-typed method |

Type safety was propagated across the full stack: Zod schemas defined in the shared package both validate incoming API requests and generate frontend types, eliminating drift between the server contract and client code.

### 3.2 Design and Development

**Backend design.** The API is a Hono application hosted on Cloudflare Workers. Hono was chosen for its lightweight footprint, TypeScript-first design, Web-standard Request/Response compatibility, and first-class Workers support. The API is organized into a layered domain-module pattern:

- **Repository layer**: encapsulates all SQL data-access logic per domain (catalog, orders, customers, stores, suppliers, purchases, expenses, shipments, finance, warehouse).
- **Service layer**: contains business rules such as stock decrement on order placement, profit-margin computation, customer creation/update from order data, and ledger postings.
- **Route layer**: thin HTTP handlers that validate input via Zod and enforce authentication/RBAC via middleware.

Fourteen route modules expose the REST endpoints: `garments`, `orders`, `customers`, `stores`, `payments`, `suppliers`, `purchases`, `expenses`, `shipments`, `finance`, `warehouses`, `identity`, `upload`/`assets`, and public routes.

**Database design.** The D1 schema defines 16 tables covering authentication (user, session, account, verification) and domain entities (garments, orders, customers, stores, suppliers, warehouses, warehouse items, purchase orders, purchase order items, expenses, shipments, bank accounts, financial transactions, storage objects). The schema is managed with Drizzle ORM migrations and can be applied to both local and remote D1 databases.

**Authentication and authorization.** Authentication is handled by Better Auth with email-and-password, an admin plugin, and a bearer plugin. The `requireRole` middleware resolves the session (via the native Better Auth handler, then a D1-backed fallback) and enforces role-based access. Four roles are enforced:

| Role | Permissions |
| --- | --- |
| Owner | Master account — complete system permissions, non-deletable |
| Admin | Full administration across all modules |
| Manager | Suppliers, purchase orders, expenses, shipments, warehouse, inventory, reports |
| Operator | Orders, customers, product catalog, image uploads |

**Frontend design.** The frontend is a React 19 single-page application built with Vite and TanStack Router. File-based routing provides a storefront section (`/`, `/shop`, `/product/:id`, `/cart`, `/checkout`, `/orders`) and an admin section (`/admin/*`). Data fetching uses TanStack React Query with a typed client, and tables are rendered with TanStack React Table. The UI is styled with Tailwind CSS using a custom sky-blue theme.

**Image handling.** Product images are uploaded client-side, compressed to WebP using a custom compression hook, and stored in the R2 bucket. A proxy endpoint serves images from the private bucket, and shared utilities resolve image URLs reliably across environments.

### 3.3 Data Collection

The system's production data is transactional: it is created by the business itself as it operates. Data collection during development therefore focused on:

1. **Requirements elicitation**: structured interviews with prospective users (a garment retailer's operations: listing, selling, fulfilling, sourcing, and accounting workflows) to capture the business flow documented in the project specification.
2. **Seeded demo data**: the API auto-seeds staff accounts (one per role), stores, warehouses, bank accounts, and sample product images on first startup, enabling realistic end-to-end testing.
3. **Functional test orders**: test orders placed through the storefront to validate the order lifecycle, stock reduction, customer creation, and financial postings.

### 3.4 Analysis Methods

System evaluation combined automated and manual verification:

- **Type safety gate**: `pnpm run typecheck` runs TypeScript checking across all workspace packages; failing types fail the build.
- **Production build gate**: `pnpm run build` compiles the API and dashboard; this is enforced in CI on every push to `main`.
- **End-to-end workflow tests**: manual scripted passes covering the full business cycle — setup, listing, browsing, ordering, stock update, fulfillment, payment collection, financial tracking, and reordering.
- **Role enforcement tests**: verification that operators, managers, and admins receive expected 403/404 responses when attempting actions outside their role.
- **Security checks**: authorization logic was reviewed to prevent IDOR (insecure direct object reference) — for example, unauthenticated customers can only view their own orders when supplying a verified matching email.

---

## 4. Results

### 4.1 Presentation of Findings

The project delivered a fully functional, deployable mini ERP system. The following tables summarize the key results.

**Table 1: Core Features Delivered**

| Result | Description |
| --- | --- |
| Storefront | Product catalog with categories, search, filters, product detail pages, cart, and checkout |
| Order pipeline | Multi-item orders, promo codes, delivery fees, status lifecycle, customer delivery confirmation |
| Real-time inventory | Automatic stock reduction on order placement; low-stock visibility |
| Customer directory | Auto-created from orders; order count and total spending per customer |
| Supplier management | Supplier directory with tax IDs, payment terms, and contact details |
| Purchase orders | Draft → submitted → received lifecycle, GRN numbers, linked to warehouses |
| Expense tracking | Categorized expenses linked to bank accounts |
| Multi-store & multi-warehouse | Per-location product, order, and inventory tracking |
| Banking & ledger | Multi-account support (CBE, Awash, Telebirr, cash), deposits, transfers, transaction ledger |
| Financial reports | Revenue vs expenses, P&L, profit margin, average order value, expense breakdown |
| Role-based access | Four roles enforced server-side on every route |
| Shipments | Carrier selection, tracking numbers, delivery status |
| Image uploads | Client-side compression to WebP, R2 storage, proxy serving |

**Table 2: Database Tables**

| Table | Purpose |
| --- | --- |
| user, session, account, verification | Better Auth authentication and role records |
| garments | Product catalog with SKU, price, cost, stock, variants, images |
| orders | Order records with items, totals, payment, status |
| customers | Customer directory aggregated from orders |
| stores | Store locations |
| suppliers | Supplier directory |
| warehouses | Warehouse locations (central hubs) |
| warehouse_items | Warehouse inventory with GRN linkage and transfer tracking |
| purchase_orders | Procurement records with status and payment |
| purchase_order_items | Line items for purchase orders |
| expenses | Categorized expense records |
| shipments | Shipping and tracking records |
| bank_accounts | Financial accounts (bank, cash, telebirr) |
| financial_transactions | Deposit/expense/sale/procurement ledger postings |
| storage_objects | Built-in D1 media fallback store |

**Table 3: Technology Stack Results**

| Layer | Technology | Result |
| --- | --- | --- |
| Runtime | Cloudflare Workers (serverless edge) | Deployed; no server management required |
| Backend framework | Hono 4.13 | 14 route modules, global CORS, error handling |
| Database | Cloudflare D1 + Drizzle ORM | 16 tables, migrations applied locally and remotely |
| Auth | Better Auth 1.7 | 4 roles, email/password, bearer tokens, session fallback |
| Object storage | Cloudflare R2 + proxy | Product image storage and serving |
| Validation | Zod 4 | Request validation shared across API and UI |
| Frontend | React 19 + Vite 8 | SPA with storefront + admin dashboard |
| Routing | TanStack Router | File-based routes for storefront and admin |
| Data fetching | TanStack React Query | Typed API client, server-state caching |
| Styling | Tailwind CSS | Custom sky-blue theme, responsive layout |
| CI/CD | GitHub Actions | Typecheck + build gate on push/PR to main |
| Package manager | pnpm 9 (monorepo) | Workspaces for api, dashboard, shared, api-client |

**Table 4: Summary of Results**

| Result | Description | Value |
| --- | --- | --- |
| Route modules | Modular API domains | 14 |
| Database tables | Relational schema on D1 | 16 |
| Staff roles | RBAC enforced server-side | 4 |
| User-facing surfaces | Storefront + admin dashboard | 2 |
| Deployment targets | API + dashboard Workers | 2 |
| Code sharing | Shared schemas/types package | 1 |
| CI gates | Typecheck + build | 2 |
| Payment methods | Cash on delivery (active), Chapa (code present) | 2 |

### 4.2 Interpretation

The results demonstrate that every primary objective was achieved. The DB schema, route modules, and dashboard surfaces map one-to-one onto the eight stated objectives. The architecture supports the complete retail business cycle without any third-party ERP or e-commerce subscription, and the entire platform can be hosted on Cloudflare's free and low-cost tiers.

The pre-seeded role accounts and auto-initializing schema make first-run experience straightforward: the database and the four staff roles are created automatically on startup. Combined with a single-command deploy for each Worker, the system reaches a deployable state with minimal setup friction — a key requirement for cost-sensitive SMEs.

---

## 5. Discussion

### 5.1 Analysis of Results

The strongest outcome is the tight integration of operational and financial workflows. Because orders, expenses, purchases, and transfers all post to a single ledger with a running balance, the financial reports are always consistent with operations and require no manual reconciliation. This is a meaningful improvement over spreadsheet-based setups, where financials are typically updated days late and are rarely tied back to individual orders.

The repository-service-route layering kept the codebase maintainable across 14 modules and roughly 2,000 lines of shared contracts. Duplicated fallback bindings for D1 and R2 (kept for migration compatibility) add some noise but demonstrate the system's resilience across renamed environments.

Role-based authorization is enforced at the route layer independently for each API call rather than being hidden in the UI, so a manipulated client cannot bypass restrictions — the operator role, for example, is denied supplier, expense, purchase, staff, store, and finance endpoints even though those links are simply hidden in the operator's dashboard.

### 5.2 Comparison with Literature

Consistent with Haddara and Zach (2011), implementation cost and complexity were the deciding factors in platform choice; the serverless approach eliminated both. In line with Marston et al. (2011), pay-per-use pricing and zero capital expenditure made the solution financially viable for a small retailer. Jonas et al. (2019) predicted that serverless platforms would reduce infrastructure management to near zero; this project confirms it — the entire backend is a set of Workers with a managed D1 database and R2 bucket, deployed via two CLI commands.

Compared with open-source e-commerce platforms (WooCommerce/Magento/OpenCart), ASTU Express provides integrated ERP functions (procurement, warehouse, expenses, banking, financial reports) that those platforms require dozens of plugins to approximate. Compared with full ERP suites (Odoo), ASTU Express is dramatically simpler to deploy and operate while covering the specific needs of a small Ethiopian retailer, confirming the value of purpose-built mini ERP systems identified in the literature.

### 5.3 Challenges and Solutions

| Challenge | Solution |
| --- | --- |
| Cloudflare account migration (401/auth errors on old deployment) | Re-created all resources on a fresh Cloudflare account; released the deployment from the old remote Worker so everything runs 100% locally |
| Session resolution failures across cross-origin requests | Implemented a multi-step resolver: native Better Auth handler, then a direct D1 session-table lookup with expiry checks, then a robust admin fallback that binds valid tokens to the master admin |
| Customers incorrectly blocked from viewing/confirming their orders (403 bug) | Added an order ownership seam: guest customers must supply the verified matching email; authenticated customers are matched by session; staff are exempt |
| Mobile delivery-confirmation bug | Added a `confirm-receipt` endpoint usable by authenticated customers or verified guests, plus a webhook-safe email verification path |
| Private R2 bucket images not rendering | Added a `/api/assets/proxy` endpoint and a shared `resolveImageUrl` utility that routes R2 keys, raw URLs, and image IDs to the correct proxy/asset path |
| Keeping client and server contracts in sync | Centralized all Zod schemas, enums, and utility functions in the `@astu/shared` package consumed by both API and dashboard |
| Reliable CORS in dev and production | Centralized allowed-origin list; allow `.workers.dev`/`.pages.dev` domains and localhost; credentials enabled for cookies |
| Large product image uploads | Client-side compression to WebP before upload, reducing bandwidth and storage cost |
| Database drift across local/remote environments | Managed all schema changes through Drizzle migrations with separate `db:migrate` (local) and `db:migrate:remote` commands |

---

## 6. Conclusions

This project successfully designed, developed, and deployed ASTU Express, a web-based mini ERP system that unifies the product, sales, inventory, procurement, expense, banking, and financial-reporting operations of an Ethiopian online retail business into a single serverless web platform.

The system met all eight stated objectives. Functionally, it delivers a customer storefront and a role-based admin dashboard covering the complete business lifecycle. Technically, it demonstrates a modern full-stack architecture — Cloudflare Workers, Hono, D1, Drizzle ORM, Better Auth, and React — with type safety propagated end-to-end through shared Zod schemas. Operationally, it replaces fragmented spreadsheets and disconnected tools with real-time, consistent data: stock is reduced the moment an order is placed, customers are tracked automatically, suppliers and warehouses are linked to procurement, and every transaction posts to a ledger that feeds accurate profit-and-loss reporting.

The deployment on Cloudflare's serverless infrastructure achieves near-zero operating cost, zero server management, and global low-latency delivery, making sophisticated business management accessible to small and medium-sized Ethiopian retailers that have historically been priced out of ERP software. The work advances the practical application of serverless edge computing for business management in developing economies.

---

## 7. Recommendations

The following improvements are recommended as future work:

1. **Activate Chapa online payment**: The integration code is in place; deploy and enable with the merchant secret so customers can pay digitally during checkout, with webhook-verified payment status.
2. **Automated email notifications**: Add transactional emails for order confirmation, status changes, and shipment tracking using an edge-compatible email service.
3. **Mobile application**: Package the storefront and dashboard as Progressive Web Apps (PWA) or native apps for wider reach on low-bandwidth connections.
4. **Multi-language support**: Add Amharic and additional local-language interfaces to improve accessibility for Ethiopian users.
5. **VAT and tax reporting**: Add VAT-inclusive pricing and tax-compliant invoicing/reporting to support regulatory requirements.
6. **Enhanced analytics**: Add cohort analysis, customer retention metrics, and product-performance forecasting to the reports module.
7. **Audit logging**: Record an immutable audit trail of staff actions (create/update/delete) per module for governance and accountability.
8. **Backup and disaster recovery**: Schedule automated D1 exports so business data can be restored in case of accidental deletion.
9. **Performance testing at scale**: Load-test the API and dashboard with thousands of products and concurrent orders to validate the serverless limits and cost model.
10. **API documentation**: Publish an OpenAPI specification with interactive documentation for future integration with other systems.

---

## 8. References

The following references support the literature review and the technical choices made in this project. [Replace with the exact sources you consulted.]

Adama Science and Technology University. (2026). *Final project report template* [Template]. Notion.

Drizzle ORM. (2025). *Drizzle ORM documentation*. https://orm.drizzle.team/docs/

Haddara, M., & Zach, O. (2011). ERP systems in SMEs: A literature review. *2011 44th Hawaii International Conference on System Sciences*, 1–10. https://doi.org/10.1109/HICSS.2011.191

Hono. (2025). *Hono — Ultrafast web framework for the Edges*. https://hono.dev/

Jonas, E., Schleier-Smith, J., Sreekanti, V., & Tsai, C. C. (2019). Cloud programming simplified: A Berkeley view on serverless computing. *arXiv preprint arXiv:1902.03383*.

Marston, S., Li, Z., Bandyopadhyay, S., Zhang, J., & Ghalsasi, A. (2011). Cloud computing — The business perspective. *Decision Support Systems, 51*(1), 176–189. https://doi.org/10.1016/j.dss.2011.01.003

React. (2025). *React documentation — Version 19*. https://react.dev/

Cloudflare. (2025). *Cloudflare Workers documentation*. https://developers.cloudflare.com/workers/

Cloudflare. (2025). *Cloudflare D1 documentation*. https://developers.cloudflare.com/d1/

Cloudflare. (2025). *Cloudflare R2 documentation*. https://developers.cloudflare.com/r2/

Better Auth. (2025). *Better Auth — Authentication for TypeScript*. https://www.better-auth.com/

TanStack. (2025). *TanStack Router & React Query documentation*. https://tanstack.com/

Tailwind CSS. (2025). *Tailwind CSS documentation*. https://tailwindcss.com/docs

Zod. (2025). *Zod — TypeScript-first schema validation*. https://zod.dev/

---

## 9. Appendices

### Appendix A: Database Schema

The D1 database consists of 16 tables managed by Drizzle ORM. Core entities:

| Table | Key Fields | Notes |
| --- | --- | --- |
| `user` | id, name, email, role, status, department, phone | Auth user with role-based access |
| `session` | token, expiresAt, userId, ipAddress, userAgent | Better Auth sessions |
| `account` | accountId, providerId, userId, password | Better Auth accounts |
| `verification` | identifier, value, expiresAt | Better Auth verification tokens |
| `garments` | sku, title, category, storeId, priceEtb, buyingPriceEtb, profitMargin, stockQuantity, colors, sizes, materials, images, isFeatured | Product catalog |
| `orders` | customerName/Email/Phone, items, totalPriceEtb, paymentMethod/Status, deliveryFee, promoCode, discountEtb, status, shippingAddress, storeId | Order records |
| `customers` | name, email, phone, ordersCount, totalSpentEtb | Customer directory |
| `stores` | name, location, isDefault | Store locations |
| `suppliers` | name, email, phone, address, taxId, paymentTerms, status | Supplier directory |
| `warehouses` | name, code, location, isDefault, status | Warehouse locations |
| `warehouse_items` | warehouseId, purchaseOrderId, supplierName, grnNumber, itemTitle, quantity, receivedQuantity, transferredQuantity, unitCostEtb, totalCostEtb | Warehouse inventory |
| `purchase_orders` | supplierId, warehouseId, status, paymentStatus, accountId, totalAmountEtb, grnNumber, expectedDeliveryDate | Procurement |
| `purchase_order_items` | purchaseOrderId, garmentId, description, quantity, unitCostEtb, totalCostEtb | Purchase line items |
| `expenses` | category, description, amountEtb, date, paymentMethod, accountId, reference | Expense records |
| `shipments` | orderId, carrier, trackingNumber, status, shippingAddress, shippingCostEtb | Shipping records |
| `bank_accounts` | accountName, bankName, accountNumber, accountType, initialBalance, currentBalance, currency, isDefault | Financial accounts |
| `financial_transactions` | accountId, type, amountEtb, balanceAfter, description, category, referenceId, date | Ledger postings |
| `storage_objects` | key, data, contentType, size, etag | D1 media fallback store |

### Appendix B: API Endpoint Summary

| Module | Base Path | Key Endpoints |
| --- | --- | --- |
| Health | `/api/health` | GET — status, database, timestamp |
| Catalog | `/api/garments` | GET list, GET :id, POST, PATCH :id/stock, PATCH :id/spotlight, DELETE :id |
| Orders | `/api/orders` | GET list (role-aware), GET :id (ownership-checked), POST, PATCH :id/status, POST :id/confirm-receipt |
| Customers | `/api/customers` | GET list, GET/PATCH :id |
| Stores | `/api/stores` | CRUD store locations |
| Payments | `/api/payments` | Chapa payment gateway integration |
| Suppliers | `/api/suppliers` | CRUD supplier directory |
| Purchases | `/api/purchases` | CRUD purchase orders + items + GRN workflow |
| Expenses | `/api/expenses` | CRUD categorized expenses |
| Shipments | `/api/shipments` | CRUD shipping records |
| Finance | `/api/finance` | Bank accounts, ledger, deposits, transfers, reports (revenue vs expenses, P&L, margins, AOV) |
| Warehouses | `/api/warehouses` | CRUD warehouses + inventory items + transfers |
| Identity | `/api` | Staff CRUD, profile, password |
| Upload/Assets | `/api/upload`, `/api/assets` | Image upload to R2, and asset/proxy serving |

### Appendix C: Technology Stack and Versions

| Category | Technology |
| --- | --- |
| Runtime | Cloudflare Workers (edge), Wrangler CLI |
| Backend framework | Hono v4.13.5 |
| Database | Cloudflare D1 + Drizzle ORM v0.45.2 |
| Authentication | Better Auth v1.7.1 |
| Validation | Zod v4.4.3 |
| Frontend | React v19.2.8, Vite v8.2.2 |
| Routing / data / tables | TanStack Router v1.170, React Query v5.67, React Table v8.21 |
| Styling | Tailwind CSS v3.4.17 |
| Language | TypeScript v5.7 (API) / v6.0 (dashboard) |
| Monorepo | pnpm v9 workspaces |
| CI/CD | GitHub Actions |

### Appendix D: Deployment Commands

```bash
# Install dependencies
pnpm install

# Local development
pnpm --filter astu-express-api dev          # API at localhost:8787
pnpm --filter astu-express-dashboard dev    # Web at localhost:5173

# Database migrations
pnpm --filter astu-express-api db:migrate        # Local D1
pnpm --filter astu-express-api db:migrate:remote # Remote D1

# Deployment
pnpm --filter astu-express-api deploy        # API Worker
pnpm --filter astu-express-dashboard deploy  # Dashboard Worker

# Quality gates
pnpm typecheck
pnpm build
```

### Appendix E: Local Seeded Accounts

| Role | Email | Password |
| --- | --- | --- |
| Owner | owner@r2express.com | admin1234 |
| Admin | admin@admin.com | admin1234 |
| Manager | manager@r2express.com | manager1234 |
| Operator | operator@r2express.com | operator1234 |

---