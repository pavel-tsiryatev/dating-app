-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'BLOCKED');

-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('DATING', 'FRIENDS', 'ACTIVITIES');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReportDecision" AS ENUM ('REJECTED', 'WARNED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('RESERVED', 'PAID', 'RELEASED');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('TICKET', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "university_email" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "telegram_id" BIGINT,
    "birth_date" DATE NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "institute" TEXT NOT NULL,
    "goal" "Goal" NOT NULL,
    "about" TEXT,
    "hide_from_institute" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "photos" (
    "photo_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("photo_id")
);

-- CreateTable
CREATE TABLE "interests" (
    "interest_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("interest_id")
);

-- CreateTable
CREATE TABLE "profile_interests" (
    "user_id" TEXT NOT NULL,
    "interest_id" INTEGER NOT NULL,

    CONSTRAINT "profile_interests_pkey" PRIMARY KEY ("user_id","interest_id")
);

-- CreateTable
CREATE TABLE "likes" (
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "is_like" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("from_user_id","to_user_id")
);

-- CreateTable
CREATE TABLE "matches" (
    "match_id" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("match_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "message_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "meeting_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "proposer_id" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "meet_at" TIMESTAMP(3) NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'PROPOSED',

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("meeting_id")
);

-- CreateTable
CREATE TABLE "reports" (
    "report_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "moderator_id" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "decision" "ReportDecision",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "partners" (
    "partner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "terms" TEXT,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("partner_id")
);

-- CreateTable
CREATE TABLE "events" (
    "event_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'RESERVED',
    "reserved_until" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("event_id","user_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "PaymentKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider_payment_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "subscription_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_university_email_key" ON "users"("university_email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "photos_user_id_position_key" ON "photos"("user_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "interests_name_key" ON "interests"("name");

-- CreateIndex
CREATE INDEX "likes_to_user_id_idx" ON "likes"("to_user_id");

-- CreateIndex
CREATE INDEX "matches_user_b_id_idx" ON "matches"("user_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user_a_id_user_b_id_key" ON "matches"("user_a_id", "user_b_id");

-- CreateIndex
CREATE INDEX "messages_match_id_sent_at_idx" ON "messages"("match_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_match_id_client_id_key" ON "messages"("match_id", "client_id");

-- CreateIndex
CREATE INDEX "reports_target_id_status_idx" ON "reports"("target_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reports_author_id_target_id_key" ON "reports"("author_id", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_payment_id_key" ON "tickets"("payment_id");

-- CreateIndex
CREATE INDEX "tickets_status_reserved_until_idx" ON "tickets"("status", "reserved_until");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_payment_id_key" ON "subscriptions"("payment_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "interests"("interest_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("match_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("match_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_proposer_id_fkey" FOREIGN KEY ("proposer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE RESTRICT ON UPDATE CASCADE;
