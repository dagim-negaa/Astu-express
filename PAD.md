# Problem Analysis Document (PAD)

**Project Title**: ASTU Express — Web-Based Mini ERP System for Inventory, Sales and Financial Operations

**Program**: [Software Engineering (SE) / Computer Science and Engineering (CSE)]

**Team Members**: [Member 1], [Member 2], [Member 3], ... (max. 7–10 students)

**Project Coordinator**: [Coordinator Name]

**Faculty Supervisor**: [Supervisor Name]

**Submission Date**: [Date]

**Version**: 1.0

---

## Print & Formatting Guide (for PDF Export)

Apply these settings when converting this document to the required PDF (max. 20 pages):

| Element | Recommended Setting |
| --- | --- |
| Body text | 11 pt (Times New Roman or a clean serif/Calibri) |
| Section headings (e.g., "1. Executive Summary") | 14 pt, bold |
| Subsection headings (e.g., "2.1 Background") | 12 pt, bold |
| Table text | 9–10 pt |
| Line spacing | 1.15 (single with spacing after paragraphs) |
| Margins | 2.5 cm (1 inch) all around |
| Alignment | Justified |
| Tables | Full-width, no wrapping where possible |
| Page budget | ~17 content pages (well within the 20-page limit) |

**Export tip:** In Word/Google Docs, set these values on the document styles before pasting the content, then "Save as PDF". Tables render best with the table font set to 10 pt and header rows bolded.

---

## 1. Executive Summary

ASTU Express is a web-based mini Enterprise Resource Planning (ERP) system designed to manage the complete business operations of an Ethiopian online retail and garment business. The system addresses a well-known operational failure in small and medium-sized Ethiopian retail enterprises: business data is scattered across spreadsheets, paper records, and disconnected messaging tools, which leads to inventory inaccuracy, lost or duplicate orders, unclear finances, inefficient procurement, and no access control.

The proposed solution is a single, unified web platform with two integrated surfaces: a customer-facing storefront for browsing and purchasing products, and a role-based back-office dashboard for managing products, orders, customers, staff, stores, suppliers, purchase orders, expenses, shipments, banking, warehouse inventory, and financial reports.

Technically, the system is a full-stack TypeScript monorepo. The backend is served on Cloudflare Workers using the Hono framework, backed by a Cloudflare D1 (SQLite) relational database managed through the Drizzle ORM, with product images stored in Cloudflare R2. Authentication and role-based access control are implemented with Better Auth, enforcing four staff roles: Owner, Admin, Manager, and Operator. The frontend is a React 19 single-page application built with Vite, TanStack Router, React Query, and Tailwind CSS. The entire platform deploys on Cloudflare's serverless edge infrastructure with near-zero fixed operating cost and no traditional server management.

The project's expected outcomes are: accurate real-time inventory, a structured order-fulfillment pipeline, an automatically maintained customer directory, integrated procurement with warehouse management, a consistent financial ledger that feeds profit-and-loss reporting, and role-secured access to all modules. Expected deliverables over the 14-week capstone timeline are this Problem Analysis Document (Week 4), a fully functional version-controlled implementation (by Week 8 mid-project review), and a demonstration video with presentation (Week 14).

---

## 2. Problem Statement & Justification

### 2.1 Background

Running a retail business involves many moving parts. Products must be listed and tracked; orders arrive from customers and must be fulfilled; money flows in from sales and flows out through expenses, supplier payments, and operational costs. Without a unified system, businesses rely on spreadsheets, paper records, or multiple disconnected tools. This leads to stock errors, lost orders, unclear finances, and wasted time.

Ethiopian online retailers in particular operate in a context where conventional ERP systems are out of reach: traditional ERP packages require large licensing fees (often in foreign currency), dedicated hardware, and specialized staff to implement and maintain. As a result, small and medium-sized enterprises (SMEs) commonly patch together manually maintained spreadsheets and chat-based order-taking, none of which give an accurate, real-time view of the business.

### 2.2 Problem Definition

The following specific problems are addressed by this project:

1. **Fragmented operations.** Business data lives in many disconnected places (spreadsheets, paper logs, messaging apps), producing duplication, inconsistency, and time wasted on manual reconciliation.
2. **Inventory inaccuracy.** Without real-time stock tracking, businesses over-sell out-of-stock items or fail to reorder in time, losing revenue and damaging customer trust.
3. **Order-management gaps.** Orders are recorded manually, statuses are unclear and inconsistent, and customers have no way to track progress, resulting in lost orders and poor service quality.
4. **Poor financial visibility.** Revenue, expenses, and profit are not tracked systematically, making it impossible for owners to judge business health or make data-driven decisions.
5. **No role-based security.** Any staff member with access to shared files can view and modify sensitive data; there is no concept of what each employee is permitted to see or do.
6. **High cost of existing ERP alternatives.** Traditional ERP systems are complex and expensive, placing them beyond the reach of small Ethiopian retailers.

### 2.3 Significance

Solving these problems has direct, quantifiable impact for a small retailer: fewer stock-outs and no overselling, faster and more reliable order fulfillment, a dependable customer base tracked automatically, reduced administrative overhead, and accurate profit visibility for business decisions. The project is also significant academically: it requires the synthesis of software engineering, database design, security, quality assurance, and professional practice knowledge, and it deploys a real product on modern serverless infrastructure — demonstrating that sophisticated business software is now accessible to businesses that could previously never afford it.

### 2.4 Expected Outcomes

- A deployable, fully functional web application combining storefront and admin dashboard.
- A normalized relational database (16 tables) with transactional integrity.
- A role-based access control system enforced server-side.
- A complete financial ledger generating revenue-versus-expenses, profit-and-loss, and margin reports.
- A version-controlled GitHub repository with a clean, disciplined history and CI quality gates.
- A 10–15 minute demonstration video and presentation covering all critical features.

---

## 3. Project Objectives (SMART)

| # | Objective | Specific | Measurable | Achievable | Relevant | Time-bound (by) |
| --- | --- | --- | --- | --- | --- | --- |
| O1 | Deliver a full-stack web application combining storefront and admin dashboard | Two integrated surfaces in one React SPA + Cloudflare Workers API | Both surfaces accessible via a single deployed URL | Yes — Hono + React + edge stack | Core of the product | Week 10 |
| O2 | Build a complete product catalog module | SKU, category, price/buying cost, stock, colors/sizes/materials, images, description, featured flag | Full CRUD via REST + UI; profit margin auto-calculated | Yes | Inventory & sales backbone | Week 7 |
| O3 | Implement an order-management pipeline | Multi-item orders, promo codes, delivery fees, status lifecycle | Status flow pending→processing→shipped→delivered; automatic stock decrement on placement | Yes | Fulfillment backbone | Week 7 |
| O4 | Maintain an automatic customer directory | Records created/updated from orders | ordersCount and totalSpentEtb computed per customer | Yes | CRM value | Week 8 |
| O5 | Create supplier and procurement modules | Supplier directory + purchase orders + GRN | PO lifecycle draft→submitted→received; warehouse inventory linked | Yes | Stock replenishment | Week 8 |
| O6 | Build a financial module | Bank accounts, ledger, categorized expenses, reports | Revenue vs expenses, P&L, margin, AOV computed for any period | Yes | Financial health | Week 9 |
| O7 | Enforce role-based access control (4 roles) | Owner, Admin, Manager, Operator | Every API route guarded; forbidden actions return 403 | Yes | Security requirement | Week 6 |
| O8 | Deploy and integrate | Cloudflare Workers/D1/R2 + CI | API and dashboard deployed; typecheck + build gates pass in CI on every push | Yes | Production readiness | Week 12 |

---

## 4. Methodology and Technical Approach

### 4.1 Overall Approach

The project follows an **iterative, agile-inspired development process**. Requirements are captured from the real business workflow of an Ethiopian online garment retailer and turned into user stories. Each iteration delivers a vertical slice — database schema, API routes, and dashboard UI together — so that the system is continuously runnable and testable. Progress is tracked in two-week sprints aligned to the capstone milestone schedule.

### 4.2 System Context

```
                       +--------------------------------------------------+
                       |                  ASTU EXPRESS                    |
                       +--------------------------------------------------+
        +---------------------------+        +---------------------------+
        |   CUSTOMER STOREFRONT     |        |   ROLE-BASED ADMIN DASH   |
        | (browse, cart, checkout,  |        | (products, orders, staff, |
        |  order tracking)          |        |  suppliers, finance, ...) |
        +------------+--------------+        +-------------+-------------+
                     |   HTTPS / JSON REST            ^   |
                     |                                |   | RBAC
                     v                                |   v
        +-------------------------------------------------------+
        |            CLOUDFLARE WORKER (API + SPA)             |
        |  Hono routes -> Services -> Repos (Drizzle)          |
        +---------+--------------+---------------+-------------+
                  |              |               |
                  v              v               v
        +----------------+ +-------------+ +-----------------+
        | Cloudflare D1  | | Cloudflare  | | Better Auth     |
        | SQLite DB      | | R2 object   | | sessions, roles |
        | (16 tables)    | | storage     | | hashed secrets  |
        +----------------+ +-------------+ +-----------------+
```

### 4.3 Architecture Design

The codebase is a **pnpm monorepo** with four packages:

| Package | Role |
| --- | --- |
| `apps/api` | Cloudflare Worker backend (Hono, Drizzle ORM, Better Auth) |
| `apps/dashboard` | React 19 single-page application (storefront + admin dashboard) |
| `packages/shared` | Shared Zod schemas, enums, and utilities consumed by API and dashboard |
| `packages/api-client` | Typed HTTP client exposing every API endpoint as a strongly typed method |

**Backend layering.** Each business domain is implemented with a three-layer pattern:

- **Repository layer** — encapsulates all SQL/data access per domain (catalog, orders, customers, stores, suppliers, purchases, expenses, shipments, finance, warehouse).
- **Service layer** — contains business rules: stock decrement on order placement, profit-margin computation, automatic customer creation/update, and financial ledger postings.
- **Route layer** — thin HTTP handlers that validate input via Zod and enforce authentication and role-based access via middleware.

Fourteen route modules expose the REST endpoints: `garments`, `orders`, `customers`, `stores`, `payments`, `suppliers`, `purchases`, `expenses`, `shipments`, `finance`, `warehouses`, `identity`, and `upload`/`assets` (images), plus public/health routes.

**Technology stack.**

| Layer | Technology |
| --- | --- |
| Runtime | Cloudflare Workers (serverless edge) |
| Backend framework | Hono 4 |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Authentication | Better Auth (email/password, admin + bearer plugins) |
| Validation | Zod 4 |
| Frontend | React 19, Vite 8, Tailwind CSS |
| Routing / data / tables | TanStack Router, TanStack Query, TanStack Table |
| Monorepo / CI | pnpm workspaces, GitHub Actions |

**Database design.** The D1 schema is normalized to third normal form with 16 tables: authentication entities (`user`, `session`, `account`, `verification`) and domain entities (`garments`, `orders`, `customers`, `stores`, `suppliers`, `warehouses`, `warehouse_items`, `purchase_orders`, `purchase_order_items`, `expenses`, `shipments`, `bank_accounts`, `financial_transactions`, `storage_objects`). Foreign keys link orders to stores, purchase orders to suppliers/warehouses, warehouse items to purchase orders, and every financial transaction to a bank account. Schema changes are managed through Drizzle migrations applied to both local and remote D1 databases.

**Deployment topology.** The API and the frontend each deploy as a Cloudflare Worker. Product images are stored in a private R2 bucket and served through a proxy endpoint. Continuous integration verifies typechecking and production builds on every push to `main`.

---

## 5. Concept Synthesis Plan

The project explicitly integrates advanced concepts from **four** domains (the guide requires at least three).

### 5.1 Software Architecture

**Concepts applied:** modular domain architecture, layered (n-tier) design, centralized API gateway-style routing, monorepo structure, shared-contract design.

**How it will be implemented:**
- The API is decomposed into 14 independent domain modules (`modules/<domain>/` with repository, service, and types), each mounted as a sub-router on a single Hono application — effectively a centralized gateway pattern that centralizes CORS policy, cookie/bearer handling, global error handling, and 404 responses.
- The `@astu/shared` package defines a single source of truth for Zod schemas and TypeScript types, so the client and server contracts cannot drift apart.
- The monorepo (pnpm workspaces) enforces clean dependency boundaries between API, dashboard, shared types, and the typed API client.

### 5.2 Data & Algorithms

**Concepts applied:** relational normalization, transaction control, atomic update operations, algorithmic metric computation (profit margin, cost of goods).

**How it will be implemented:**
- The database is normalized to 3NF: line items (orders, purchase orders) are separated from their parent records; financial postings are separated from account balances; repeated data such as customer aggregate fields is derived from transaction data.
- Placing an order performs an atomic stock decrement and ledger-relevant updates so that a stock reduction never happens without the corresponding order — preventing overselling under concurrent requests.
- Every financial transaction stores a computed `balanceAfter`, giving an auditable running balance per account.
- The catalog service computes each product's profit margin from retail price and buying cost, and the finance service derives revenue, expenses, net profit, profit margin, and average order value from the ledger — non-trivial aggregations over time-filtered datasets.

### 5.3 Security

**Concepts applied:** role-based access control, authentication protocols, cryptographic session and password handling, threat analysis, OWASP Top-10 mitigation, input validation.

**How it will be implemented:**
- **Authentication:** Better Auth with email/password. Passwords are stored as salted, hashed digests; sessions use signed tokens, with a D1-backed fallback session resolver for cross-origin and admin clients.
- **Authorization (RBAC):** a `requireRole` middleware evaluates the authenticated user's role on every protected route. Owner and Admin hold master access; Manager is limited to suppliers, purchases, expenses, shipments, and warehouse modules; Operator covers products, orders, customers, and image uploads. Role checks run server-side, independent of what the UI hides.
- **Input validation:** every mutation and query is validated against Zod schemas before reaching the service layer.
- **IDOR prevention:** order and customer endpoints verify ownership — authenticated customers can only view their own orders; guests must supply the verified matching email to view or confirm an order.
- **CORS:** a centralized allowlist (localhost and the project's Workers/Pages domains) with credentials enabled, limiting cross-origin abuse.

### 5.4 Software Quality (QA/Testing)

**Concepts applied:** automated quality gates, integration/end-to-end workflow testing, code coverage-oriented verification, static type-checking as a build gate.

**How it will be implemented:**
- **CI pipeline:** GitHub Actions runs `pnpm typecheck` and `pnpm build` across the workspace on every push and pull request to `main`, failing the pipeline on regressions.
- **Integration tests:** scripted end-to-end passes covering the full business cycle — setup, listing, browsing, ordering, stock update, fulfillment, payment collection, financial tracking, and reordering.
- **Role-enforcement tests:** verification that Operator, Manager, and Admin receive the expected 403/404 responses on actions outside their role.
- **Edge-case robustness:** guest order-ownership verification, delivery-confirmation seams, and asset/R2 proxy routing are explicitly tested against failure cases found during development.

---

## 6. Team Roles, Work Distribution, Timeline, and Milestones

### 6.1 Team Roles

| Role | Name | Responsibilities |
| --- | --- | --- |
| Project Coordinator | [Name] | Formal communication with the Faculty Supervisor, submission management |
| Project Manager / Scrum Master | [Name] | Sprint planning, task tracking, process adherence, milestone reporting |
| Lead Architect / Senior Developer | [Name] | System design, repository/API architecture, integration integrity |
| Quality Assurance (QA) Lead | [Name] | Testing strategy, test-case generation, CI quality gates, code review |
| Documentation Specialist | [Name] | PAD, progress reports, user manual, presentation materials |
| Developer | [Name] | Storefront UI, frontend components |
| Developer | [Name] | Catalog, orders, and customers modules |
| Developer | [Name] | Finance, procurement, and warehouse modules |

### 6.2 Work Distribution

| Work Package | Primary Owner |
| --- | --- |
| Requirements & PAD | Documentation Specialist + PM |
| Database schema & migrations | Lead Architect |
| Authentication & RBAC middleware | QA Lead + Lead Architect |
| Catalog, orders, customers modules | Developer 2 |
| Suppliers, purchases, warehouse modules | Developer 3 |
| Finance, expenses, shipments modules | Developer 3 |
| Storefront (browse, cart, checkout) | Developer 1 |
| Admin dashboard UI | Developer 1 |
| CI pipeline & QA gates | QA Lead |
| Deployment (Workers/D1/R2) | Lead Architect |
| Demo video & presentation | Documentation Specialist + all |

### 6.3 Timeline and Milestones (14 weeks)

| Week | Milestone | Deliverable |
| --- | --- | --- |
| 1–2 | Group registration & project selection | Registered group, project title |
| 3–4 | Requirements, architecture, PAD | **PAD submission (Week 4)** |
| 5–6 | Setup monorepo, DB schema, auth/RBAC | Working skeleton, CI green |
| 7 | Catalog, orders, customers modules | Vertical slices functional |
| 8 | Procurement, finance, warehouse modules | **Mid-Project Review (Week 8)** |
| 9–10 | Storefront + admin dashboard completion | Full UI functional |
| 11 | Image pipeline, edge cases, hardening | Robustness verified |
| 12 | Deployment to Cloudflare, QA regression | Live deployment |
| 13 | Demo video & presentation recording | 10–15 min MP4 + YouTube link |
| 14 | Final submission, documentation polish | **Final Code & Video (Week 14)** |

---

## 7. Risk Analysis & Mitigation

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Cloudflare account / deployment failures (401 errors, retired remote Worker) | High | High | Keep full local workflow (Wrangler + local D1); create all cloud resources fresh on one account; document deployment in a dedicated guide |
| R2 | Cross-origin session failures cause false 403s for customers | High | High | Multi-step session resolver (native handler → D1 token lookup → admin fallback); ownership-seam endpoints for guests |
| R3 | Private R2 images fail to render on the storefront | Medium | Medium | Client-side WebP compression; centralized image resolution utility; `/api/assets` proxy endpoint |
| R4 | Schema drift between local and remote databases | Medium | High | All schema changes via Drizzle migrations; separate local vs remote migration commands in CI and docs |
| R5 | Scope creep (native apps, ML features, VAT reporting) | Medium | Medium | Explicit out-of-scope list in this PAD; feature freeze after Week 10 |
| R6 | Uneven team contribution or Git history | Medium | Medium | Formal role assignment; require per-member contribution commits on feature branches; PM review at each sprint |
| R7 | Incomplete PAD coverage vs rubric | Low | Medium | Iterate PAD against the guide's rubric checklist before Week 4 submission |
| R8 | Payment gateway not live (Chapa) | Medium | Medium | Ship cash-on-delivery first; keep Chapa integration code behind a feature flag |
| R9 | Data loss or accidental deletion | Low | High | Documented DB reset/re-seed; scheduled D1 export; never store secrets in the repository |
| R10 | Slow team onboarding to the stack | Medium | Medium | Shared-concepts workshops; reference documentation (Workers, Hono, Drizzle) provided in the repo |

---

## 8. References

[Replace with the exact sources consulted.]

- Cloudflare. (2025). *Cloudflare Workers, D1, and R2 documentation*. https://developers.cloudflare.com/
- Hono. (2025). *Hono — Ultrafast web framework for the Edges*. https://hono.dev/
- Drizzle ORM. (2025). *Drizzle ORM documentation*. https://orm.drizzle.team/docs/
- Better Auth. (2025). *Better Auth — Authentication for TypeScript*. https://www.better-auth.com/
- React. (2025). *React documentation*. https://react.dev/
- TanStack. (2025). *TanStack Router, Query & Table documentation*. https://tanstack.com/
- Zod. (2025). *Zod — TypeScript-first schema validation*. https://zod.dev/
- Adama Science and Technology University. (2026). *Capstone Project Guide: CSE and SE* [Course guide].