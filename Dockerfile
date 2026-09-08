# ==========================================
# Stage 1: Build NestJS Telegram Bot
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci || npm install
RUN npx prisma generate
COPY . ./
RUN npm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install utilities for healthcheck
RUN apk add --no-cache curl wget

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev || npm install --omit=dev
RUN npm install prisma --no-save
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Create uploads directory for persistent receipts and assign ownership to node user
RUN mkdir -p /app/uploads/receipts && chown -R node:node /app

USER node

EXPOSE 4000

# Container healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --spider --quiet http://localhost:4000/api/health || exit 1

CMD ["node", "dist/main.js"]
