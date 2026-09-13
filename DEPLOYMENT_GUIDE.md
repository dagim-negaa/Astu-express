# R2 Express — Ethiopian Shipping & Mini ERP: Setup & Deployment Guide

This guide explains how to:
1. Run everything **100% locally on localhost** with zero external dependencies (no old Cloudflare account, no 401 errors).
2. Connect and deploy to a **brand-new Cloudflare account** whenever you are ready.

---

## 1. Local Development (100% Localhost, Zero Remote Dependencies)

The workspace is now completely released from the previous remote Cloudflare worker (`api.hun-wrk0966.workers.dev`). All API endpoints, authentication, and D1 database operations run on your local machine.

### Prerequisites & Dependencies
```bash
# In the repository root:
pnpm install
```

### Start Local Services

Open two terminal windows:

#### Terminal 1 — Start the Local API Worker:
```bash
pnpm --filter astu-express-api dev
```
- **Local API URL**: `http://localhost:8787`
- Uses a fast, embedded local SQLite database managed by Wrangler in `.wrangler/state/v3/d1`.
- The database schema and all 4 staff roles are **automatically created and seeded** on startup.

#### Terminal 2 — Start the Unified Web Platform (Storefront + Admin):
```bash
pnpm --filter astu-express-dashboard dev
```
- **Local Web Platform URL**: `http://localhost:5173`
- Points directly to `http://localhost:8787` via `.env` and the Vite development proxy.

---

### Local Seeded Accounts (4 Strict Roles)

When testing locally, click **Admin Login** and use any of these credentials:

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@r2express.com` | `admin1234` | Master account — complete system permissions |
| **Admin** | `admin@admin.com` | `admin1234` | Full administration across all modules |
| **Manager** | `manager@r2express.com` | `manager1234` | Purchases, expenses, shipments, inventory & reports |
| **Operator** | `operator@r2express.com` | `operator1234` | Orders, customer profiles & product catalog |

---

## 2. Pushing to Your Own GitHub Repository

The old repository link has been disconnected. To connect and push this project to your own GitHub account:

```bash
# 1. Stage all files
git add -A

# 2. Create commit
git commit -m "feat: complete overhaul and rebrand to astu-express"

# 3. Add your new GitHub repository as origin
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# 4. Push to main branch
git branch -M main
git push -u origin main
```

---

## 3. Deploying to a New Cloudflare Account (On Another Device or Server)

When you are on your other device with your other Cloudflare account:

### Step 3.1: Log in with your new Cloudflare account
```bash
npx wrangler logout
npx wrangler login
```
Follow the browser prompt to authorize Wrangler with your new Cloudflare account.

---

### Step 3.2: Create New Cloudflare Resources

#### A. Create the D1 Database:
```bash
npx wrangler d1 create astu-express-db
```
Wrangler will output something like:
```text
✅ Successfully created DB 'astu-express-db'!
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
Copy this `database_id`.

#### B. Create the R2 Storage Bucket:
```bash
npx wrangler r2 bucket create astu-express-assets
```

---

### Step 3.3: Update `apps/api/wrangler.jsonc`

Open `apps/api/wrangler.jsonc` and replace the `database_id` with the one generated above:
```jsonc
"d1_databases": [
  {
    "binding": "astu_express_db",
    "database_name": "astu-express-db",
    "database_id": "<PASTE_YOUR_NEW_DATABASE_ID_HERE>",
    "migrations_dir": "./drizzle/migrations"
  }
]
```

---

### Step 3.4: Apply Migrations to Remote D1
```bash
pnpm --filter astu-express-api db:migrate:remote
```

---

### Step 3.5: Set Production Secrets on Cloudflare
Set your session encryption secret:
```bash
npx wrangler secret put BETTER_AUTH_SECRET --name astu-express-api
# Enter a secure 32+ character random string when prompted
```

---

### Step 3.6: Deploy the API Worker
```bash
pnpm --filter astu-express-api deploy
```
Wrangler will output your live worker URL:
`https://astu-express-api.<your-new-subdomain>.workers.dev`

---

<<<<<<< HEAD
### Step 3.7: Deploy Unified Web Platform (Storefront + Admin) to Cloudflare Workers
The frontend is deployed directly as a native Cloudflare Worker using Static Assets (no Cloudflare Pages needed):
1. Build and deploy the unified web app in one command:
=======
### Step 3.7: Deploy Web Dashboard to Cloudflare Workers (or Pages)
1. Build the dashboard:
>>>>>>> 36c76f4793ab648d0e50c1f2b444aa3513f9661b
   ```bash
   pnpm --filter astu-express-dashboard deploy
   ```
<<<<<<< HEAD
2. Your live frontend will be active at:
   `https://astu-express-dashboard.<your-subdomain>.workers.dev`

---

## 4. Active Cloudflare Production Deployment (dagimnega208@gmail.com)

* **Dashboard & Storefront Worker**: `https://astu-express-dashboard.dagimnega208.workers.dev`
* **Backend API Worker**: `https://astu-express-api.dagimnega208.workers.dev`
* **D1 Database**: `r2-express-db` (`db2a091d-791d-4c39-b84c-a838c3e829a2`)
* **R2 Bucket**: `astu-express` (exclusive storage bucket)
* **Cloudflare Pages**: Completely removed/deleted. Everything runs 100% on Cloudflare Workers.
=======
2. Deploy directly as a **Cloudflare Worker**:
   ```bash
   pnpm --filter dashboard run deploy
   ```
   Wrangler will output your live Dashboard Worker URL:
   `https://astu-garment-dashboard.<your-subdomain>.workers.dev`

*(Optional: Deploy to Cloudflare Pages instead)*:
   ```bash
   npx wrangler pages deploy apps/dashboard/dist --project-name=astu-garment-dashboard
   ```

---


### Step 3.8: Mobile App Production Configuration
In `apps/mobile/.env` or EAS project secrets:
* `EXPO_PUBLIC_API_URL` = `https://astu-garment-api.<your-subdomain>.workers.dev`
>>>>>>> 36c76f4793ab648d0e50c1f2b444aa3513f9661b
