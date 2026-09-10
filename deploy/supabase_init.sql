-- ==============================================================================
-- 🎡 YALFAL ONLINE ETA — SUPABASE / POSTGRESQL INITIALIZATION SCHEMA
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/nimbyjoybfhowofqdmql/sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'REVIEWER', 'SUPPORT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RoundStatus" AS ENUM ('DRAFT', 'OPEN', 'PAUSED', 'FULL', 'DRAWING', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TicketStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'CONFIRMED', 'WON');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethodCode" AS ENUM ('CBE', 'TELEBIRR', 'BOA', 'AWASH');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PrizePosition" AS ENUM ('FIRST_PRIZE', 'SECOND_PRIZE', 'THIRD_PRIZE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Tables
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "telegramId" TEXT NOT NULL UNIQUE,
    "phone" TEXT UNIQUE,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "admins" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "lottery_rounds" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "roundNumber" INTEGER NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "ticketPrice" DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    "maxTickets" INTEGER NOT NULL DEFAULT 200,
    "firstPrize" DECIMAL(10,2) NOT NULL DEFAULT 10000.00,
    "secondPrize" DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    "thirdPrize" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "status" "RoundStatus" NOT NULL DEFAULT 'OPEN',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "drawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tickets" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "roundId" TEXT NOT NULL REFERENCES "lottery_rounds"("id") ON DELETE CASCADE,
    "ticketNumber" INTEGER NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'AVAILABLE',
    "userId" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "reservedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roundId_ticketNumber" UNIQUE ("roundId", "ticketNumber")
);

CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "ticketId" TEXT NOT NULL UNIQUE REFERENCES "tickets"("id") ON DELETE CASCADE,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethodCode" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL UNIQUE,
    "adminNotes" TEXT,
    "reviewedById" TEXT REFERENCES "admins"("id") ON DELETE SET NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "receipts" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "paymentId" TEXT NOT NULL UNIQUE REFERENCES "payments"("id") ON DELETE CASCADE,
    "originalName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "hash" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "draws" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "roundId" TEXT NOT NULL UNIQUE REFERENCES "lottery_rounds"("id") ON DELETE CASCADE,
    "adminId" TEXT NOT NULL REFERENCES "admins"("id"),
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditMetadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "winners" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "roundId" TEXT NOT NULL REFERENCES "lottery_rounds"("id") ON DELETE CASCADE,
    "ticketId" TEXT NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
    "drawId" TEXT NOT NULL REFERENCES "draws"("id") ON DELETE CASCADE,
    "position" "PrizePosition" NOT NULL,
    "prizeAmount" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "randomnessMetadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "payment_methods" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "code" "PaymentMethodCode" NOT NULL UNIQUE,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Initial Seed: Super Admin (admin@yalfal.et / AdminPassword2026!)
INSERT INTO "admins" ("email", "passwordHash", "name", "role", "permissions")
VALUES (
    'admin@yalfal.et',
    '$2a$10$w8FepP61uH4Vv6p8i3k8UOn9Lz5C9qfC9/o7.Z9UqXQ5X/59NlWvG',
    'Super Admin',
    'SUPER_ADMIN',
    ARRAY['MANAGE_ROUNDS', 'REVIEW_PAYMENTS', 'MANAGE_USERS', 'DRAW_WINNERS', 'MANAGE_SETTINGS', 'VIEW_AUDIT', 'BROADCAST']
) ON CONFLICT ("email") DO NOTHING;

-- 4. Payment Methods: CBE & Telebirr
INSERT INTO "payment_methods" ("code", "accountName", "accountNumber", "instructions", "isActive")
VALUES
('CBE', 'Yalfal Online Eta Ltd.', '1000346643289', 'Transfer exact 100 ETB per ticket to our CBE account. Capture screenshot of receipt showing reference ID.', true),
('TELEBIRR', 'Yalfal Online Eta', '0913344061', 'Send 100 ETB via Telebirr. Capture screenshot or PDF showing the transaction SMS / confirmation code.', true)
ON CONFLICT ("code") DO UPDATE SET "accountNumber" = EXCLUDED."accountNumber";

-- 5. System Settings
INSERT INTO "system_settings" ("key", "value", "description")
VALUES
('PLATFORM_NAME', 'Yalfal Online Eta', 'Platform official name'),
('TAGLINE', 'Your Number. Your Chance. Your Moment.', 'Official slogan'),
('SUPPORT_TELEGRAM', '@yalfalonlinebot', 'Telegram support handle'),
('TICKET_PRICE', '100', 'Standard ticket entry price in ETB'),
('MAX_TICKETS_PER_ROUND', '200', 'Capacity of numbers per round'),
('CBE_ACCOUNT_NUMBER', '1000346643289', 'CBE payment account number'),
('CBE_ACCOUNT_NAME', 'Yalfal Online Eta Lottery', 'CBE beneficiary name'),
('TELEBIRR_PHONE', '0913344061', 'Telebirr payment phone number'),
('TELEBIRR_ACCOUNT_NAME', 'Yalfal Online Eta', 'Telebirr account name')
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";

-- 6. Genesis Round #001
DO $$
DECLARE
    v_round_id TEXT;
    i INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "lottery_rounds" WHERE "roundNumber" = 1) THEN
        INSERT INTO "lottery_rounds" ("roundNumber", "name", "ticketPrice", "maxTickets", "firstPrize", "secondPrize", "thirdPrize", "status")
        VALUES (1, 'Grand Genesis Draw #001', 100.00, 200, 10000.00, 1000.00, 500.00, 'OPEN')
        RETURNING "id" INTO v_round_id;

        -- Create tickets 1 to 200
        FOR i IN 1..200 LOOP
            INSERT INTO "tickets" ("roundId", "ticketNumber", "status")
            VALUES (v_round_id, i, 'AVAILABLE');
        END LOOP;
    END IF;
END $$;
