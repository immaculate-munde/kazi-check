import { cvFileName, renderCvPdf } from "@/lib/cv/render-pdf";
import { canPrepareForCheck, scoreFit, type FitResult } from "@/lib/fit/score";
import { prisma, prismaEnabled } from "@/lib/db";
import type { SeekerProfile } from "@/lib/profile/types";
import type { CheckRecord } from "@/lib/types";

export type PreparedApplication = {
  fit: FitResult;
  fileName: string;
  pdf: Buffer;
  fitAssessmentId?: string;
  tailoredCvId?: string;
};

const g = globalThis as unknown as {
  __kcPrepared?: Map<string, PreparedApplication>;
};

function memKey(checkId: string, userId: string) {
  return `${checkId}:${userId}`;
}

function memStore(): Map<string, PreparedApplication> {
  g.__kcPrepared ??= new Map();
  return g.__kcPrepared;
}

export async function prepareApplicationPack(opts: {
  check: CheckRecord;
  userId: string;
  profile: SeekerProfile;
}): Promise<PreparedApplication | { blocked: true; reason: string }> {
  if (!canPrepareForCheck(opts.check)) {
    return {
      blocked: true,
      reason: "This job looks too risky. We will not build a CV for it.",
    };
  }

  const fit = scoreFit(opts.profile, opts.check);
  const pdf = await renderCvPdf({
    profile: opts.profile,
    roleTitle: fit.roleTitle,
    matchBullets: fit.matchBullets,
  });
  const fileName = cvFileName(opts.profile, fit.roleTitle);

  if (prismaEnabled()) {
    const assessment = await prisma.fitAssessment.upsert({
      where: {
        checkId_userId: { checkId: opts.check.id, userId: opts.userId },
      },
      create: {
        checkId: opts.check.id,
        userId: opts.userId,
        score: fit.score,
        label: fit.label,
        matchBullets: fit.matchBullets,
        gapBullets: fit.gapBullets,
        roleTitle: fit.roleTitle,
      },
      update: {
        score: fit.score,
        label: fit.label,
        matchBullets: fit.matchBullets,
        gapBullets: fit.gapBullets,
        roleTitle: fit.roleTitle,
      },
    });

    const pdfBytes = new Uint8Array(pdf);
    const cv = await prisma.tailoredCv.upsert({
      where: { fitAssessmentId: assessment.id },
      create: {
        fitAssessmentId: assessment.id,
        fileName,
        pdf: pdfBytes,
        templateVersion: "ats-v1",
      },
      update: {
        fileName,
        pdf: pdfBytes,
        templateVersion: "ats-v1",
      },
    });

    return {
      fit,
      fileName,
      pdf,
      fitAssessmentId: assessment.id,
      tailoredCvId: cv.id,
    };
  }

  const pack: PreparedApplication = { fit, fileName, pdf };
  memStore().set(memKey(opts.check.id, opts.userId), pack);
  return pack;
}

export async function getPreparedPdf(
  checkId: string,
  userId: string,
): Promise<{ fileName: string; pdf: Buffer } | null> {
  if (prismaEnabled()) {
    const assessment = await prisma.fitAssessment.findUnique({
      where: { checkId_userId: { checkId, userId } },
      include: { tailoredCv: true },
    });
    if (!assessment?.tailoredCv) return null;
    return {
      fileName: assessment.tailoredCv.fileName,
      pdf: Buffer.from(assessment.tailoredCv.pdf),
    };
  }
  const pack = memStore().get(memKey(checkId, userId));
  if (!pack) return null;
  return { fileName: pack.fileName, pdf: pack.pdf };
}

export async function getFitForCheck(
  checkId: string,
  userId: string,
): Promise<FitResult | null> {
  if (prismaEnabled()) {
    const assessment = await prisma.fitAssessment.findUnique({
      where: { checkId_userId: { checkId, userId } },
    });
    if (!assessment) return null;
    return {
      score: assessment.score,
      label: assessment.label as FitResult["label"],
      matchBullets: assessment.matchBullets as string[],
      gapBullets: assessment.gapBullets as string[],
      roleTitle: assessment.roleTitle,
    };
  }
  return memStore().get(memKey(checkId, userId))?.fit ?? null;
}

export function resetPreparedForTests() {
  memStore().clear();
}
