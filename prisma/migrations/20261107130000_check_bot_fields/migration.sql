-- AlterTable
ALTER TABLE "Check" ADD COLUMN "gaps" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Check" ADD COLUMN "confirmYourself" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Check" ADD COLUMN "officialListing" JSONB;
ALTER TABLE "Check" ADD COLUMN "notifyPhone" TEXT;
ALTER TABLE "Check" ADD COLUMN "retroAlertedAt" TIMESTAMP(3);
