-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_payment_id_fkey";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "confirmation_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "consent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE CASCADE ON UPDATE CASCADE;
