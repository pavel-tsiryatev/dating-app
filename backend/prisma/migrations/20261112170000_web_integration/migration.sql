-- AlterTable
ALTER TABLE "events" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Встречи',
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "poster_url" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "is_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'light';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "checked_in_at" TIMESTAMP(3),
ADD COLUMN     "pass_token" TEXT;
UPDATE "tickets" SET "pass_token" = gen_random_uuid()::text WHERE "pass_token" IS NULL;
ALTER TABLE "tickets" ALTER COLUMN "pass_token" SET NOT NULL;

-- CreateTable
CREATE TABLE "user_blocks" (
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("blocker_id","blocked_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_pass_token_key" ON "tickets"("pass_token");

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

