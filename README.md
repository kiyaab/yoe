# 🎡 YALFAL ONLINE ETA
> **“Your Number. Your Chance. Your Moment.”**  
> Unified Next.js Fullstack WebApp & Telegram Mini App Digital Lottery Platform

---

## 📌 Product Overview

**Yalfal Online Eta** is a complete, production-grade lottery platform with **dual-access experience**:
1. **Interactive Next.js Web Application**: Accessible from any modern desktop or mobile browser.
2. **Telegram Mini App**: Launches directly inside Telegram with 1-click automatic authentication (`window.Telegram.WebApp.initData`).
3. **Telegram Bot Engine**: Embedded Telegraf webhook handler (`/api/telegram/webhook`) for instant message updates, status commands, and ticket purchase alerts.

### Key Lottery Parameters:
- **Available Numbers:** 1–200 per lottery round
- **Ticket Entry Fee:** 100 ETB
- **Round Capacity:** 200 participants maximum
- **Total Ticket Revenue:** 20,000 ETB
- **Guaranteed Prizes:**
  - 🥇 **1st Prize:** 10,000 ETB
  - 🥈 **2nd Prize:** 1,000 ETB
  - 🥉 **3rd Prize:** 500 ETB
- **Accepted Payment Methods:** Commercial Bank of Ethiopia (CBE) & Ethio Telecom Telebirr
- **Draw Algorithm:** Node.js Cryptographically Secure Pseudorandom Number Generator (`crypto.randomInt` / CSPRNG) with progressive exclusion of prior winners.
- **Spin Wheel Experience:** Visual animated rotating drum and 3D wheel with celebratory confetti animations (`canvas-confetti`).

---

## 🏛️ Unified Architecture

Everything lives in **one unified repository** at the root:

```
yalfal-online-eta/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                  # High-impact Landing Page & Prize Showcase
│   ├── tickets/page.tsx          # Interactive 1–200 Ticket Selector (10-Page Tabs)
│   ├── checkout/page.tsx         # Payment Details (CBE/Telebirr) & Receipt Upload
│   ├── draw/page.tsx             # Live Animated Spin Wheel & Winner Podium
│   ├── login/page.tsx            # Phone/Password & Telegram 1-Click Login
│   ├── register/page.tsx         # Account Creation
│   ├── my-tickets/page.tsx       # User Portal (Ticket Status & History)
│   ├── admin/                    # In-Browser Admin Control Suite
│   │   ├── page.tsx              # Dashboard Metrics & Round Controls
│   │   ├── payments/page.tsx     # Receipt Queue (Full-Res Photo Modal + Approve/Reject)
│   │   ├── draw/page.tsx         # Admin CSPRNG Draw Console
│   │   └── settings/page.tsx     # CBE & Telebirr Bank Account Configuration
│   └── api/                      # Fullstack API Route Handlers
│       ├── auth/                 # Login, Register, Me, Telegram Auth
│       ├── lottery/              # Active round information
│       ├── tickets/              # 1–200 status, concurrency reservation, my tickets
│       ├── payments/             # CBE/Telebirr instructions, receipt SHA-256 upload
│       ├── admin/                # Stats, payment review, draw execution, settings
│       ├── telegram/webhook/     # Embedded Telegraf Webhook Handler
│       └── health/               # Deep Health Check (DB, Redis, Bot, RAM, Uptime)
├── components/                   # Modern Glassmorphic UI (Navbar, Footer)
├── lib/                          # Prisma Singleton, Auth (JWT/HMAC), CSPRNG Draw, Redis Lock
├── prisma/                       # PostgreSQL Schema & Seed
├── deploy/                       # 24/7 Linux VPS Provisioning & Nginx Configuration
├── Dockerfile                    # Next.js Standalone Multi-Stage Alpine Container
├── docker-compose.prod.yml       # Production Stack (Next.js :3000, Postgres, Redis, Nginx, Backup)
└── package.json                  # Next.js 14, React 18, Prisma, Telegraf, TailwindCSS
```

---

## 🚀 Running Locally (Windows / macOS / Linux)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Configure DATABASE_URL and TELEGRAM_BOT_TOKEN

# 3. Generate Prisma client & seed initial round
npx prisma generate
npx prisma db push
npm run db:seed

# 4. Start Next.js development server
npm run dev
```

Open your browser to:
- **Web App**: `http://localhost:3000`
- **Ticket Selector**: `http://localhost:3000/tickets`
- **Live Spin Wheel**: `http://localhost:3000/draw`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **Health Diagnostics**: `http://localhost:3000/api/health`

---

## 🌐 24/7 VPS Deployment (Ubuntu 24.04 LTS)

### Step 1: Provision Server
```bash
git clone https://github.com/kiyaab/yoe.git /opt/yalfal-online-eta
cd /opt/yalfal-online-eta
sudo bash deploy/setup-vps.sh
```

### Step 2: Configure Production Environment
```bash
nano /opt/yalfal-online-eta/.env.production
```

### Step 3: Deploy
```bash
bash deploy/deploy.sh
```

Nginx automatically terminates SSL on ports 80/443 and proxies to the Next.js fullstack standalone server on port 3000.

---

## 🧪 Testing & Verification

```bash
# CSPRNG Draw Engine Fairness Tests
npm test

# Build Production Next.js Bundle
npm run build
```