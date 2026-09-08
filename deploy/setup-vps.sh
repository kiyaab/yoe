#!/usr/bin/env bash
# ==============================================================================
# Yalfal Online Eta - Production Ubuntu 24.04 LTS VPS Provisioning Script
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  🎡 Yalfal Online Eta - 24/7 Production VPS Provisioning      ${NC}"
echo -e "${BLUE}  Ubuntu 24.04 LTS Server Initialization                        ${NC}"
echo -e "${BLUE}================================================================${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run this script as root or with sudo.${NC}"
  exit 1
fi

# 1. Update and Upgrade System
echo -e "\n${YELLOW}🔄 [1/6] Updating operating system packages...${NC}"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    fail2ban \
    certbot \
    python3-certbot-nginx \
    htop \
    jq \
    tar \
    gzip

# 2. Install Docker & Docker Compose
echo -e "\n${YELLOW}🐳 [2/6] Installing Docker Engine & Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✅ Docker installed successfully.${NC}"
else
    echo -e "${GREEN}✅ Docker already installed.${NC}"
fi

# 3. Configure Firewall (UFW)
echo -e "\n${YELLOW}🛡️ [3/6] Hardening Firewall (UFW)...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP / Certbot'
ufw allow 443/tcp comment 'HTTPS Telegram Webhook'
ufw --force enable
echo -e "${GREEN}✅ UFW enabled: Ports 22, 80, and 443 open.${NC}"

# 4. Configure Fail2Ban
echo -e "\n${YELLOW}🔒 [4/6] Configuring Fail2ban anti-brute-force protection...${NC}"
cat << 'EOF' > /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo -e "${GREEN}✅ Fail2ban configured and running.${NC}"

# 5. Setup Application Directory
APP_DIR="/opt/yalfal-online-eta"
echo -e "\n${YELLOW}📁 [5/6] Preparing application directory at ${APP_DIR}...${NC}"
mkdir -p "${APP_DIR}"
mkdir -p /var/www/certbot
mkdir -p /etc/letsencrypt/live/bot

# 6. Generate Environment Template if missing
if [ ! -f "${APP_DIR}/.env.production" ]; then
    echo -e "\n${YELLOW}🔑 [6/6] Generating default production secrets template...${NC}"
    RAND_DB_PASS=$(openssl rand -hex 24)
    RAND_JWT_SECRET=$(openssl rand -hex 32)
    RAND_WEBHOOK_SECRET=$(openssl rand -hex 32)

    cat << EOF > "${APP_DIR}/.env.production"
# ==============================================================================
# Yalfal Online Eta - Production VPS Environment Configuration
# ==============================================================================
NODE_ENV=production
PORT=4000

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${RAND_DB_PASS}
POSTGRES_DB=yalfal_online_eta

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=${RAND_JWT_SECRET}

# Telegram Bot Engine
TELEGRAM_BOT_MODE=webhook
# ⚠️ REPLACE WITH YOUR FRESH BOT TOKEN FROM @BotFather
TELEGRAM_BOT_TOKEN=YOUR_REVOKED_AND_ROTATED_BOT_TOKEN
TELEGRAM_ADMIN_IDS=YOUR_TELEGRAM_NUMERIC_ID

# HTTPS Webhook Settings
TELEGRAM_WEBHOOK_DOMAIN=bot.yourdomain.com
TELEGRAM_WEBHOOK_SECRET=${RAND_WEBHOOK_SECRET}
EOF
    echo -e "${GREEN}✅ Created ${APP_DIR}/.env.production with cryptographically secure random secrets.${NC}"
else
    echo -e "${GREEN}✅ Existing ${APP_DIR}/.env.production found.${NC}"
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}  🎉 VPS Provisioning Complete!                                 ${NC}"
echo -e "${GREEN}  Next Steps:                                                   ${NC}"
echo -e "${GREEN}  1. Clone or copy the repo to ${APP_DIR}                       ${NC}"
echo -e "${GREEN}  2. Edit ${APP_DIR}/.env.production with your Bot Token and ID ${NC}"
echo -e "${GREEN}  3. Run certbot to obtain your SSL certificate:                ${NC}"
echo -e "     certbot certonly --standalone -d bot.yourdomain.com       "
echo -e "     ln -s /etc/letsencrypt/live/bot.yourdomain.com /etc/letsencrypt/live/bot"
echo -e "${GREEN}  4. Run: bash deploy/deploy.sh                                 ${NC}"
echo -e "${GREEN}================================================================${NC}"
