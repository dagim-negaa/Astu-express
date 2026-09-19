# 📦 ASTU Express

> **Web-Based Mini ERP System for Inventory, Sales, and Financial Operations**  
> *A Capstone Project at Adama Science and Technology University (ASTU)*

[![Live Storefront & Dashboard](https://img.shields.io/badge/Live-Storefront%20%26%20Dashboard-0284c7?style=flat-square&logo=cloudflare)](https://astu-express-dashboard.astu-express-api.workers.dev)
[![Live Edge API](https://img.shields.io/badge/Live-Edge%20API-f97316?style=flat-square&logo=cloudflare)](https://astu-express-api.astu-express-api.workers.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%26%20D1-f38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)

---

## 📖 Overview

**ASTU Express** is a cloud-native, web-based Mini Enterprise Resource Planning (ERP) and e-commerce shipping platform tailored for Ethiopian retail and garment businesses. 

Ethiopian small and medium retail enterprises frequently face operational bottlenecks due to fragmented spreadsheets, manual paper records, and disconnected messaging apps. These issues often cause inventory discrepancies, lost orders, delayed shipping, and lack of real-time financial visibility.

ASTU Express solves these challenges with an integrated, single-platform architecture combining:
1. **A Customer Storefront & Live Order Tracking System**
2. **A Centralized Warehouse & Inventory Management Hub (GRN & Production)**
3. **An ERP Admin Dashboard with Automated Financial Accounting (P&L)**

---

## 🌐 Live System URLs

| Service | Access Link | Description |
|---|---|---|
| **Storefront & Admin ERP** | [astu-express-dashboard.workers.dev](https://astu-express-dashboard.astu-express-api.workers.dev) | Customer shopping portal, public order tracking, and staff ERP |
| **Edge API Service** | [astu-express-api.workers.dev](https://astu-express-api.astu-express-api.workers.dev) | Serverless RESTful Hono API deployed on Cloudflare Workers |

---

## ✨ Core System Features

### 🛍️ 1. Customer Storefront
- **Ethiopian Apparel & Lifestyle Catalog**: Categorized showcase of ready-to-wear, traditional Habesha Kemis, outerwear, and accessories.
- **Cart & Fast Checkout**: Streamlined checkout with delivery details and local payment integrations (Telebirr, CBE Birr, and Cash on Delivery).
- **Public Live Order Tracking**: Customers can look up order status, shipping milestone updates, and printable packing slips using either their **Tracking Number** (`ASTU-TRK-...`) or their **Email address** without needing an admin account.
- **Unified Single Login**: Clean, centralized authentication on the storefront Account page for customers, staff, and system administrators.

### 🏭 2. Warehouse & Inventory Operations
- **Goods Received Notes (GRN)**: Formal stock intake logging from suppliers with unit costs, batch reference, and automated category stock assignment.
- **Warehouse-to-Storefront Workflow**: Production modal allowing admins to inspect available warehouse stock by category (e.g. Shemiz, Pants, Habesha Kemis) and allocate precise quantities to the public storefront.
- **Atomic Stock Decrement**: Automatic real-time inventory reductions when customer orders are placed, with out-of-stock validation guards.

### 📊 3. Mini ERP Financial Management
- **Automated Profit & Loss (P&L)**: Real-time calculation of Gross Sales, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, and Net Margin.
- **Expense Logging**: Categorized tracking for Logistics/Fuel, Packaging, Marketing, Utilities, and Warehouse rent.
- **Delivery & Packing Slips**: Formatted, print-ready delivery slips with itemized garment breakdowns and tracking numbers.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions enforced across 5 roles: `Owner`, `Admin`, `Manager`, `Operator`, and `Customer`.

---

## 🏗️ Architecture & Technology Stack

```
                               ┌────────────────────────────────────────┐
                               │             Client Layer               │
                               │  React 19 SPA (TanStack Router & Query)│
                               └───────────────────┬────────────────────┘
                                                   │ HTTPS
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │          Cloudflare Edge API           │
                               │      Hono Framework (14 Routes)        │
                               └───────────┬────────────────┬───────────┘
                                           │                │
                        ┌──────────────────▼────┐     ┌─────▼──────────────────┐
                        │     Cloudflare D1     │     │     Cloudflare R2      │
                        │ Serverless SQLite DB  │     │ Product Image Storage  │
                        │     (Drizzle ORM)     │     └────────────────────────┘
                        └───────────────────────┘
```

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, TanStack Router, TanStack Query, Tailwind CSS, Lucide Icons |
| **Backend API** | Cloudflare Workers, Hono Framework, RESTful API |
| **Database** | Cloudflare D1 (Serverless Distributed SQLite), Drizzle ORM |
| **Storage** | Cloudflare R2 (Object Storage for image assets) |
| **Authentication** | Better Auth with SQLite storage and role-based session resolution |
| **Monorepo Tooling**| pnpm Workspaces, Vite, Wrangler CLI |

---

## 📁 Repository Structure

```
Astu-express/
├── apps/
│   ├── api/                    # Cloudflare Workers REST API (Hono + Drizzle)
│   │   ├── drizzle/            # SQL migration snapshots and journals
│   │   ├── src/
│   │   │   ├── db/             # Drizzle database schemas and seed scripts
│   │   │   ├── middleware/     # Auth, session, and CORS middlewares
│   │   │   ├── modules/        # Domain modules (orders, inventory, finance, etc.)
│   │   │   └── routes/         # 14 REST route controllers
│   │   └── wrangler.jsonc      # Cloudflare Worker deployment configuration
│   └── dashboard/              # React 19 Frontend (Storefront & Admin ERP)
│       ├── src/
│       │   ├── components/     # UI components, layout, and packing slip modals
│       │   ├── hooks/          # React Query & customer auth hooks
│       │   ├── routes/         # TanStack file-based routes (Storefront & /admin)
│       │   └── store/          # Global client state management
│       └── wrangler.jsonc      # Cloudflare Workers Static Assets configuration
├── packages/
│   ├── api-client/             # Type-safe API client shared between apps
│   └── shared/                 # Shared TypeScript interfaces, types, and constants
├── FINAL_PROJECT_REPORT.md     # Full academic capstone documentation
├── DEPLOYMENT_GUIDE.md         # Deployment & Cloudflare disaster recovery guide
└── package.json                # Root monorepo configuration
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.0.0 or higher recommended)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`pnpm install -g wrangler`)

### 1. Clone the Repository
```bash
git clone https://github.com/dagim-negaa/Astu-express.git
cd Astu-express
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables

**Backend (`apps/api/.dev.vars`)**:
```ini
BETTER_AUTH_SECRET="your-secure-auth-secret-key-32-chars-min"
BETTER_AUTH_URL="http://localhost:8787"
ENVIRONMENT="development"
ADMIN_REGISTRATION_KEY="astu-admin-secret-2026"
STOREFRONT_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173,https://astu-express-dashboard.astu-express-api.workers.dev"
```

**Frontend (`apps/dashboard/.env`)**:
```ini
VITE_API_URL="http://localhost:8787"
```

### 4. Initialize Local Database
```bash
# Apply local D1 schema migrations
pnpm --filter astu-express-api exec wrangler d1 migrations apply astu-express-db --local

# Seed initial categories, suppliers, and sample garments
pnpm --filter astu-express-api db:seed:local
```

### 5. Run Development Servers
```bash
# Start both backend and frontend concurrently
pnpm dev
```
- **Storefront & Admin**: `http://localhost:5173`
- **Backend API**: `http://localhost:8787`

---

## ☁️ Deployment

Both applications are configured for deployment on Cloudflare:

```bash
# Build all packages and applications
pnpm build

# Deploy Backend API Worker to Cloudflare
pnpm deploy:api

# Deploy Frontend SPA (Static Assets) to Cloudflare
pnpm deploy:dashboard
```

For complete step-by-step instructions on binding D1 databases, R2 buckets, and setting production secrets, refer to [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

---

## 🎓 Academic Project Information

- **Institution**: Adama Science and Technology University (ASTU)
- **Program**: Department of Information Technology / Computer Science
- **Project Type**: Final Year Capstone Project
- **Academic Year**: 2026
- **Student / Author**: Dagim Nega ([@dagim-negaa](https://github.com/dagim-negaa))

For complete design rationale, evaluation results, and research literature review, see the [`FINAL_PROJECT_REPORT.md`](./FINAL_PROJECT_REPORT.md).

---

## 📄 License

This project is submitted for academic evaluation as a capstone project at Adama Science and Technology University. All rights reserved.
