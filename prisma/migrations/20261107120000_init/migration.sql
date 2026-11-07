-- CreateEnum
CREATE TYPE "CheckDirection" AS ENUM ('job_offer', 'applicant', 'offer_letter');

-- CreateEnum
CREATE TYPE "SubjectKind" AS ENUM ('domain', 'phone', 'url', 'handle', 'email');

-- CreateTable
CREATE TABLE "Check" (
    "id" TEXT NOT NULL,
    "direction" "CheckDirection" NOT NULL,
    "rawText" TEXT NOT NULL,
    "url" TEXT,
    "verdict" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskBand" TEXT NOT NULL DEFAULT 'LOW',
    "recommendedAction" TEXT NOT NULL DEFAULT '',
    "extracted" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT,
    "sourceType" TEXT,
    "retrievedAt" TEXT,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "kind" "SubjectKind" NOT NULL,
    "key" TEXT NOT NULL,
    "direction" "CheckDirection",
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL DEFAULT '',
    "lastFlaggedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckSubject" (
    "checkId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "CheckSubject_pkey" PRIMARY KEY ("checkId","subjectId")
);

-- CreateTable
CREATE TABLE "Flag" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainWhitelist" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Impersonation" (
    "id" TEXT NOT NULL,
    "fakePattern" TEXT NOT NULL,
    "officialDomain" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Impersonation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subject_flagCount_idx" ON "Subject"("flagCount");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_kind_key_key" ON "Subject"("kind", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Flag_subjectId_fingerprintHash_key" ON "Flag"("subjectId", "fingerprintHash");

-- CreateIndex
CREATE UNIQUE INDEX "DomainWhitelist_domain_key" ON "DomainWhitelist"("domain");

-- CreateIndex
CREATE INDEX "Impersonation_fakePattern_idx" ON "Impersonation"("fakePattern");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "Check"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckSubject" ADD CONSTRAINT "CheckSubject_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "Check"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckSubject" ADD CONSTRAINT "CheckSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
