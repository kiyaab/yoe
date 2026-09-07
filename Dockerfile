# ==========================================
# Stage 1: Build Frontend Static Export
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Backend NestJS
# ==========================================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install
RUN npx prisma generate
COPY backend/ ./
RUN npm run build

# ==========================================
# Stage 3: Production Runner (Single Port)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Copy backend dependencies & compiled code
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
WORKDIR /app/backend
RUN npm install --only=production
RUN npx prisma generate
COPY --from=backend-builder /app/backend/dist ./dist

# Copy frontend static export
COPY --from=frontend-builder /app/frontend/out /app/frontend/out

EXPOSE 4000
CMD ["node", "dist/main.js"]
