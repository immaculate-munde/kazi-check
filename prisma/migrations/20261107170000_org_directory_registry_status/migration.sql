-- CreateEnum
CREATE TYPE "RegistryStatus" AS ENUM ('unverified', 'under_investigation', 'confirmed');

-- CreateEnum
CREATE TYPE "OrgReviewStatus" AS ENUM ('verified', 'needs_review');

-- AlterTable
ALTER TABLE "Check" ADD COLUMN "findings" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN "status" "RegistryStatus" NOT NULL DEFAULT 'unverified';
ALTER TABLE "Subject" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" JSONB NOT NULL DEFAULT '[]',
    "category" TEXT NOT NULL DEFAULT 'private',
    "officialWebsite" TEXT,
    "careersUrl" TEXT NOT NULL,
    "officialDomain" TEXT NOT NULL,
    "officialApplyRoute" TEXT NOT NULL DEFAULT 'portal',
    "applyUrl" TEXT NOT NULL,
    "emailDomain" TEXT NOT NULL,
    "listingTitle" TEXT NOT NULL,
    "listingUrl" TEXT NOT NULL,
    "dateIndexed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chargesFee" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" "OrgReviewStatus" NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationDomain" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isEmailDomain" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganisationDomain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organisation_name_key" ON "Organisation"("name");
CREATE UNIQUE INDEX "OrganisationDomain_domain_key" ON "OrganisationDomain"("domain");
CREATE INDEX "OrganisationDomain_organisationId_idx" ON "OrganisationDomain"("organisationId");

ALTER TABLE "OrganisationDomain" ADD CONSTRAINT "OrganisationDomain_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
