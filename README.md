# 🎡 YALFAL ONLINE ETA
> **“Your Number. Your Chance. Your Moment.”**  
> Telegram-Only Digital Lottery Bot — 100% Inside Telegram.

---

## 📌 Product Overview

**Yalfal Online Eta** is a complete, production-grade lottery platform designed to operate **100% inside Telegram**. 
There is no website, no web dashboard, and no external app required. Both participants and platform administrators manage the entire lifecycle directly through `@yalfalonlinebot`.

### Key Parameters:
- **Available Numbers:** 1–200 per lottery round
- **Ticket Entry Fee:** 100 ETB
- **Round Capacity:** 200 participants maximum
- **Total Ticket Revenue:** 20,000 ETB
- **Prizes:**
  - 🥇 **1st Prize:** 10,000 ETB
  - 🥈 **2nd Prize:** 1,000 ETB
  - 🥉 **3rd Prize:** 500 ETB
- **Supported Payment Methods:** Commercial Bank of Ethiopia (CBE) & Ethio Telecom Telebirr
- **Draw Algorithm:** Node.js Cryptographically Secure Pseudorandom Number Generator (`crypto.randomInt` / CSPRNG) with exclusion of previous round prize winners.
- **Spin Wheel Experience:** Visual animated message-editing sequence directly inside Telegram with timed suspense pauses.

---

## 🌐 24/7 Production VPS Architecture

Designed to operate continuously on an always-on Linux VPS (Ubuntu 24.04 LTS), surviving server reboots, network glitches, and container updates.

```
                         TELEGRAM CLIENT
                                │
                                ▼
                         Telegram Bot API
                                │
                         HTTPS Webhook
                                │
                                ▼
                         NGINX (Port 443)
                  SSL Termination / Rate Limiting
                                │
                                ▼
                    Yalfal Bot (NestJS :4000)
                 Telegraf 4.x Webhook Engine
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
PostgreSQL 16              Redis 7 Alpine        Persistent Volume
(Transactions / ACID)   (Distributed Locking)   (/app/uploads/receipts)
        │
        ▼
PostgreSQL Backup
(Daily gzip + 7d retention)
```

### Production Stack Highlights:
- **Zero Polling in Production:** Webhook mode with `secret_token` validation and automatic retry handling.
- **Multi-Container Isolation:** Managed via `docker-compose.prod.yml` with isolated bridge networking and non-root process execution.
- **Automatic Self-Healing:** All containers configured with `restart: unless-stopped` and Docker healthchecks.
- **Durable Storage:** Named volumes (`postgres_data`, `redis_data`, `receipts_data`, `backup_data`) guarantee zero data loss during restarts or host reboot.
- **Automated Nightly Backups:** Standalone backup daemon runs `pg_dump` with `gzip` at 02:00 UTC and auto-prunes snapshots older than 7 days.
- **Deep Health Check:** Real-time diagnostics endpoint at `GET /api/health` and `GET /health` inspecting Database connectivity, Redis ping, Bot engine status, Memory usage, and System uptime.

---

## 📱 User & Admin Journey (100% In-Telegram)

### Participant Workflow
1. `/start` -> Branded greeting with live round information and interactive menu.
2. `🎟 Buy Number` -> 10-page inline keyboard pagination (1–20, 21–40 ... 181–200) displaying 🟢 Available and ❌ Taken indicators.
3. Number Selection -> Confirmation dialog (`🎟 NUMBER SELECTED #087`).
4. Payment Details -> Dynamic CBE account number and Telebirr phone instructions.
5. Receipt Upload -> User submits payment screenshot/document; system calculates SHA-256 hash to prevent duplicate submissions and sets state to `PENDING`.
6. Ticket Confirmation -> User is notified immediately when payment is verified.

### Administrator Suite (`/admin`)
Access restricted to authorized numeric IDs in `TELEGRAM_ADMIN_IDS`:
- `📊 Dashboard` -> Live round metrics (tickets sold, approved revenue, pending queue).
- `💳 Pending Payments` -> Interactive receipt review cards with `[✅ APPROVE]` and `[❌ REJECT]` buttons + custom rejection dialog.
- `🎟 Tickets` -> Search by ticket number, Telegram ID, or username.
- `👥 Users` -> Participant history, ticket count, approved/rejected stats.
- `🎡 Lottery` -> Create round, pause round, close sales, and trigger CSPRNG draw.
- `🏆 Winners` -> Immutable historical winner records.
- `📢 Broadcast` -> Send messages to participants with preview dialog.
- `⚙️ Settings` -> Configure CBE account, Telebirr phone, and support contacts.
- `📜 Audit Logs` -> Complete administrative audit trail.

---

## 🚀 24/7 VPS Deployment (Ubuntu 24.04 LTS)

### Step 1: Provision the VPS
Run the turnkey provisioning script as root on your Ubuntu 24.04 LTS server:
```bash
# Clone the repository to the server
git clone https://github.com/kiyaab/yoe.git /opt/yalfal-online-eta
cd /opt/yalfal-online-eta

# Run turnkey server provisioning (installs Docker, UFW firewall, Fail2ban, Certbot)
sudo bash deploy/setup-vps.sh
```

### Step 2: Configure Environment & Domain
1. Point your domain (e.g. `bot.yourdomain.com`) DNS `A` record to your VPS IP address.
2. Obtain a free Let's Encrypt SSL certificate:
```bash
sudo certbot certonly --standalone -d bot.yourdomain.com
sudo ln -s /etc/letsencrypt/live/bot.yourdomain.com /etc/letsencrypt/live/bot
```
3. Edit `/opt/yalfal-online-eta/.env.production`:
```bash
nano /opt/yalfal-online-eta/.env.production
```
Configure your credentials:
```env
TELEGRAM_BOT_TOKEN=YOUR_REVOKED_AND_ROTATED_BOT_TOKEN
TELEGRAM_ADMIN_IDS=YOUR_TELEGRAM_NUMERIC_ID
TELEGRAM_BOT_MODE=webhook
TELEGRAM_WEBHOOK_DOMAIN=bot.yourdomain.com
TELEGRAM_WEBHOOK_SECRET=your_random_32_character_secret
POSTGRES_PASSWORD=your_strong_postgres_password
JWT_SECRET=your_jwt_secret
```

### Step 3: Launch Production Stack
```bash
bash deploy/deploy.sh
```
This script automatically:
- Validates environment configuration
- Builds production Docker images
- Starts PostgreSQL and Redis
- Executes Prisma database migrations (`npx prisma migrate deploy`)
- Starts NestJS Telegram Bot, Nginx, and Backup containers
- Validates deep healthcheck at `http://localhost:4000/api/health`

---

## 🔒 Security & Telegram Bot Token Rotation

> [!CAUTION]
> **Token Rotation Requirement:** Any BotFather token previously tested on a local PC or exposed in chat history must be immediately revoked before production launch.
> 1. Open Telegram and message [@BotFather](https://t.me/BotFather).
> 2. Send `/revoke` and select your bot.
> 3. Copy the newly generated token.
> 4. Put the new token ONLY in `.env.production` on your secure Linux VPS.
> 5. Never commit your `.env` or `.env.production` file to any git repository.

---

## 🩺 Monitoring & Diagnostics

### Deep Health Check Endpoint
Query the health check at any time from your VPS or an external monitoring service (e.g., Uptime Kuma, BetterUptime):

```bash
curl https://bot.yourdomain.com/api/health
```

Sample 200 OK Response:
```json
{
  "status": "ok",
  "timestamp": "2026-09-08T06:15:00.000Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "latencyMs": 2
  },
  "redis": {
    "status": "connected"
  },
  "bot": {
    "mode": "webhook",
    "username": "yalfalonlinebot",
    "webhookDomain": "bot.yourdomain.com",
    "status": "active"
  },
  "memory": {
    "heapUsedMb": 54,
    "heapTotalMb": 72,
    "rssMb": 110
  }
}
```

### Container Management Commands
```bash
# Check running containers
docker compose -f docker-compose.prod.yml ps

# View live bot logs
docker compose -f docker-compose.prod.yml logs -f bot

# View automated database backup logs
docker compose -f docker-compose.prod.yml logs -f backup

# Trigger manual immediate database backup
docker compose -f docker-compose.prod.yml exec backup /backup.sh

# Restart the entire stack
docker compose -f docker-compose.prod.yml restart
```

---

## 🧪 Local Testing & Verification

```bash
# Run unit & CSPRNG fairness tests (100% pass)
npm test

# Run high-concurrency race condition tests
npx jest --config test/jest-e2e.json

# Build NestJS distribution bundle
npm run build
```