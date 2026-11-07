-- CreateTable
CREATE TABLE "BotQueueItem" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "filename" TEXT,
    "status" TEXT NOT NULL,
    "maskedText" TEXT NOT NULL,
    "checkId" TEXT,
    "verdict" TEXT,
    "riskScore" INTEGER,
    "flaggedCount" INTEGER,
    "unknownCount" INTEGER,
    "gate" TEXT,
    "reason" TEXT,
    "gaps" JSONB NOT NULL DEFAULT '[]',
    "confirmedGaps" JSONB,
    "draftText" TEXT,
    "apply" JSONB,
    "notifyPhone" TEXT,
    "retroAlertedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BotQueueItem_createdAt_idx" ON "BotQueueItem"("createdAt");

-- CreateIndex
CREATE INDEX "BotQueueItem_checkId_idx" ON "BotQueueItem"("checkId");
