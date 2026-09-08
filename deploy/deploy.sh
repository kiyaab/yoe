#!/usr/bin/env bash
# ==============================================================================
# Yalfal Online Eta - Zero-Downtime Production Deployment Script
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "${APP_DIR}"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  🚀 Yalfal Online Eta - Deploying Production Containers        ${NC}"
echo -e "${BLUE}================================================================${NC}"

ENV_FILE=".env.production"
if [ ! -f "${ENV_FILE}" ]; then
    if [ -f ".env" ]; then
        ENV_FILE=".env"
    else
        echo -e "${RED}❌ Error: Neither .env.production nor .env found in ${APP_DIR}.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}📄 Using environment file: ${ENV_FILE}${NC}"

# Source environment variables
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

# Sanity check
if [ "${TELEGRAM_BOT_TOKEN}" = "YOUR_REVOKED_AND_ROTATED_BOT_TOKEN" ] || [ -z "${TELEGRAM_BOT_TOKEN}" ]; then
    echo -e "${RED}❌ Error: TELEGRAM_BOT_TOKEN is not configured in ${ENV_FILE}!${NC}"
    echo -e "${YELLOW}Please edit ${ENV_FILE} and insert your active BotFather token.${NC}"
    exit 1
fi

# Pull latest code if git repo
if [ -d ".git" ]; then
    echo -e "\n${YELLOW}📥 Pulling latest git repository updates...${NC}"
    git pull origin main || echo -e "${YELLOW}⚠️ Git pull skipped or not on main.${NC}"
fi

# Build images
echo -e "\n${YELLOW}🔨 Building Docker production images...${NC}"
docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" build bot backup

# Bring up databases first
echo -e "\n${YELLOW}🗄️ Starting PostgreSQL and Redis data services...${NC}"
docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" up -d postgres redis

# Wait for postgres health
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be fully ready...${NC}"
for i in {1..30}; do
    if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-yalfal_online_eta}" &>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is healthy and accepting connections.${NC}"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start within 30 seconds.${NC}"
        docker compose -f docker-compose.prod.yml logs postgres
        exit 1
    fi
    sleep 1
done

# Run Prisma migrations
echo -e "\n${YELLOW}🔄 Applying database migrations (prisma migrate deploy)...${NC}"
docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" run --rm bot npx prisma migrate deploy

# Launch all production containers
echo -e "\n${YELLOW}🚀 Launching all production services (Bot, Nginx, Backup)...${NC}"
docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" up -d --remove-orphans

# Healthcheck Verification Loop
echo -e "\n${YELLOW}🩺 Performing deep health check verification...${NC}"
HEALTHY=false
for i in {1..15}; do
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health || echo "000")
    if [ "$STATUS_CODE" -eq 200 ]; then
        HEALTHY=true
        break
    fi
    echo -e "Attempt ${i}/15: HTTP ${STATUS_CODE}... waiting 2s"
    sleep 2
done

if [ "$HEALTHY" = true ]; then
    HEALTH_PAYLOAD=$(curl -s http://localhost:4000/api/health)
    echo -e "\n${GREEN}================================================================${NC}"
    echo -e "${GREEN}  🎉 DEPLOYMENT SUCCESSFUL! BOT IS ONLINE 24/7                  ${NC}"
    echo -e "${GREEN}================================================================${NC}"
    echo -e "Diagnostics: ${HEALTH_PAYLOAD}"
    echo -e "\nActive Containers:"
    docker compose -f docker-compose.prod.yml ps
else
    echo -e "\n${RED}================================================================${NC}"
    echo -e "${RED}  ❌ HEALTHCHECK FAILED! Check bot logs below:                  ${NC}"
    echo -e "${RED}================================================================${NC}"
    docker compose -f docker-compose.prod.yml logs --tail=50 bot
    exit 1
fi
