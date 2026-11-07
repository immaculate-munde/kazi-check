import type {
  CheckDirection,
  CheckRecord,
  EvidenceItem,
  Extracted,
  Finding,
  FlagInput,
  OfficialListingMatch,
  RegistryStatus,
  RegistrySubject,
  RiskBand,
  SubjectKind,
  SubjectRef,
  Verdict,
} from "@/lib/types";
import { prisma } from "@/lib/db";
import { aggregateReasons } from "@/lib/store/reasons";
import type {
  CheckDirection as PrismaDirection,
  SubjectKind as PrismaSubjectKind,
} from "@prisma/client";

function toDirection(d: CheckDirection): PrismaDirection {
  return d as PrismaDirection;
}

function toSubjectKind(k: SubjectKind): PrismaSubjectKind {
  return k as PrismaSubjectKind;
}

function dateToIsoDay(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function mapSubject(row: {
  id: string;
  kind: SubjectKind | PrismaSubjectKind;
  key: string;
  direction: CheckDirection | PrismaDirection | null;
  flagCount: number;
  summary: string;
  lastFlaggedAt: Date | null;
  status?: RegistryStatus | string;
  isPublished?: boolean;
  flags: { reason: string | null; createdAt: Date }[];
}): RegistrySubject {
  const flagPayload = row.flags.map((f) => ({
    reason: f.reason ?? "",
    createdAt: f.createdAt.toISOString(),
  }));
  return {
    id: row.id,
    kind: row.kind as SubjectKind,
    key: row.key,
    direction: (row.direction as CheckDirection | null) ?? null,
    flagCount: row.flagCount,
    summary: row.summary,
    lastFlaggedAt: dateToIsoDay(row.lastFlaggedAt),
    status: (row.status as RegistryStatus) ?? "unverified",
    isPublished: row.isPublished ?? false,
    topReasons: aggregateReasons(flagPayload),
    recentFlags: flagPayload
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8),
  };
}

export async function prismaGetOrCreateSubject(
  kind: SubjectKind,
  key: string,
  direction: CheckDirection | null,
  summary = "",
): Promise<{
  id: string;
  kind: SubjectKind;
  key: string;
  flagCount: number;
  topReasons: string[];
}> {
  const existing = await prisma.subject.findUnique({
    where: { kind_key: { kind: toSubjectKind(kind), key } },
    include: { flags: true },
  });
  if (existing) {
    if (summary && !existing.summary) {
      await prisma.subject.update({
        where: { id: existing.id },
        data: { summary },
      });
    }
    return {
      id: existing.id,
      kind: existing.kind as SubjectKind,
      key: existing.key,
      flagCount: existing.flagCount,
      topReasons: aggregateReasons(existing.flags),
    };
  }

  const created = await prisma.subject.create({
    data: {
      kind: toSubjectKind(kind),
      key,
      direction: direction ? toDirection(direction) : null,
      summary,
    },
  });
  return {
    id: created.id,
    kind: created.kind as SubjectKind,
    key: created.key,
    flagCount: created.flagCount,
    topReasons: [],
  };
}

export async function prismaCreateCheck(input: {
  direction: CheckDirection;
  rawText: string;
  url?: string;
  verdict: Verdict;
  score: number;
  riskScore: number;
  riskBand: RiskBand;
  recommendedAction: string;
  extracted: Extracted;
  evidence: EvidenceItem[];
  findings?: Finding[];
  subjects: SubjectRef[];
  gaps: string[];
  confirmYourself: string[];
  officialListing?: OfficialListingMatch;
  notifyPhone?: string | null;
}): Promise<CheckRecord> {
  const check = await prisma.check.create({
    data: {
      direction: toDirection(input.direction),
      rawText: input.rawText,
      url: input.url,
      verdict: input.verdict,
      score: input.score,
      riskScore: input.riskScore,
      riskBand: input.riskBand,
      recommendedAction: input.recommendedAction,
      extracted: input.extracted as object,
      findings: input.findings ?? [],
      gaps: input.gaps,
      confirmYourself: input.confirmYourself,
      officialListing: input.officialListing
        ? (input.officialListing as object)
        : undefined,
      notifyPhone: input.notifyPhone ?? null,
      evidence: {
        create: input.evidence.map((e) => ({
          ruleId: e.ruleId,
          title: e.title,
          snippet: e.snippet,
          severity: e.severity,
          source: e.source,
          sourceType: e.sourceType,
          retrievedAt: e.retrievedAt,
        })),
      },
      subjects: {
        create: input.subjects.map((s) => ({
          subjectId: s.id,
        })),
      },
    },
    include: {
      evidence: true,
      subjects: { include: { subject: { include: { flags: true } } } },
    },
  });

  return mapCheck(check);
}

function mapCheck(check: {
  id: string;
  direction: PrismaDirection;
  rawText: string;
  url: string | null;
  verdict: string;
  score: number;
  riskScore: number;
  riskBand: string;
  recommendedAction: string;
  extracted: unknown;
  findings?: unknown;
  gaps: unknown;
  confirmYourself: unknown;
  officialListing: unknown;
  notifyPhone: string | null;
  retroAlertedAt: Date | null;
  createdAt: Date;
  evidence: {
    ruleId: string;
    title: string;
    snippet: string;
    severity: string;
    source: string | null;
    sourceType: string | null;
    retrievedAt: string | null;
  }[];
  subjects: {
    subject: {
      id: string;
      kind: PrismaSubjectKind;
      key: string;
      flagCount: number;
      flags: { reason: string | null }[];
    };
  }[];
}): CheckRecord {
  return {
    id: check.id,
    direction: check.direction as CheckDirection,
    rawText: check.rawText,
    url: check.url,
    verdict: check.verdict as Verdict,
    score: check.score,
    riskScore: check.riskScore,
    riskBand: check.riskBand as RiskBand,
    recommendedAction: check.recommendedAction,
    extracted: check.extracted as Extracted,
    findings: (check.findings as Finding[]) ?? [],
    evidence: check.evidence.map((e) => ({
      ruleId: e.ruleId,
      title: e.title,
      snippet: e.snippet,
      severity: e.severity as EvidenceItem["severity"],
      source: e.source ?? undefined,
      sourceType: (e.sourceType as EvidenceItem["sourceType"]) ?? undefined,
      retrievedAt: e.retrievedAt ?? undefined,
    })),
    subjects: check.subjects.map(({ subject }) => ({
      id: subject.id,
      kind: subject.kind as SubjectKind,
      key: subject.key,
      flagCount: subject.flagCount,
      topReasons: aggregateReasons(subject.flags),
    })),
    gaps: (check.gaps as string[]) ?? [],
    confirmYourself: (check.confirmYourself as string[]) ?? [],
    officialListing: (check.officialListing as OfficialListingMatch) ?? undefined,
    notifyPhone: check.notifyPhone,
    retroAlertedAt: check.retroAlertedAt?.toISOString() ?? null,
    createdAt: check.createdAt.toISOString(),
  };
}

export async function prismaGetCheck(id: string): Promise<CheckRecord | null> {
  const check = await prisma.check.findUnique({
    where: { id },
    include: {
      evidence: true,
      subjects: { include: { subject: { include: { flags: true } } } },
    },
  });
  if (!check) return null;
  return mapCheck(check);
}

export async function prismaListChecks(): Promise<CheckRecord[]> {
  const rows = await prisma.check.findMany({
    include: {
      evidence: true,
      subjects: { include: { subject: { include: { flags: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapCheck);
}

export async function prismaUpdateCheck(
  id: string,
  patch: Partial<CheckRecord>,
): Promise<CheckRecord | null> {
  const data: {
    retroAlertedAt?: Date | null;
    notifyPhone?: string | null;
  } = {};
  if ("retroAlertedAt" in patch) {
    data.retroAlertedAt = patch.retroAlertedAt
      ? new Date(patch.retroAlertedAt)
      : null;
  }
  if ("notifyPhone" in patch) {
    data.notifyPhone = patch.notifyPhone ?? null;
  }
  try {
    const check = await prisma.check.update({
      where: { id },
      data,
      include: {
        evidence: true,
        subjects: { include: { subject: { include: { flags: true } } } },
      },
    });
    return mapCheck(check);
  } catch {
    return null;
  }
}

export async function prismaListRegistry(
  direction?: CheckDirection,
): Promise<RegistrySubject[]> {
  const rows = await prisma.subject.findMany({
    where: {
      OR: [{ flagCount: { gt: 0 } }, { summary: { not: "" } }],
      ...(direction ? { direction: toDirection(direction) } : {}),
    },
    include: { flags: true },
    orderBy: { flagCount: "desc" },
  });
  return rows.map(mapSubject);
}

export async function prismaGetSubject(
  id: string,
): Promise<RegistrySubject | null> {
  const row = await prisma.subject.findUnique({
    where: { id },
    include: { flags: true },
  });
  if (!row) return null;
  return mapSubject(row);
}

export async function prismaAddFlag(input: FlagInput): Promise<{
  subjectId: string;
  flagCount: number;
  alreadyFlagged: boolean;
  reason: string;
  topReasons: string[];
}> {
  const reason =
    (input.reason ?? "").trim() || "Flagged as scam without details";

  let subjectId: string | undefined;

  if (input.checkId) {
    const link = await prisma.checkSubject.findFirst({
      where: { checkId: input.checkId },
      include: { subject: { include: { flags: true } } },
    });
    if (link) subjectId = link.subjectId;
  }

  if (!subjectId && input.kind && input.key) {
    const row = await prismaGetOrCreateSubject(
      input.kind,
      input.key,
      null,
      reason,
    );
    subjectId = row.id;
  }

  if (!subjectId) {
    throw new Error(
      "Subject not found: provide kind+key or checkId with subjects",
    );
  }

  const existing = await prisma.flag.findUnique({
    where: {
      subjectId_fingerprintHash: {
        subjectId,
        fingerprintHash: input.fingerprintHash,
      },
    },
  });
  if (existing) {
    const subject = await prisma.subject.findUniqueOrThrow({
      where: { id: subjectId },
      include: { flags: true },
    });
    return {
      subjectId,
      flagCount: subject.flagCount,
      alreadyFlagged: true,
      reason,
      topReasons: aggregateReasons(subject.flags),
    };
  }

  const before = await prisma.subject.findUniqueOrThrow({
    where: { id: subjectId },
  });

  await prisma.flag.create({
    data: {
      subjectId,
      fingerprintHash: input.fingerprintHash,
      reason,
    },
  });

  const refreshed = await prisma.subject.update({
    where: { id: subjectId },
    data: {
      flagCount: { increment: 1 },
      lastFlaggedAt: new Date(),
      ...(before.summary ? {} : { summary: reason }),
    },
    include: { flags: true },
  });

  return {
    subjectId,
    flagCount: refreshed.flagCount,
    alreadyFlagged: false,
    reason,
    topReasons: aggregateReasons(refreshed.flags),
  };
}

function statusRank(status: RegistryStatus | string | undefined): number {
  if (status === "confirmed") return 2;
  if (status === "under_investigation") return 1;
  return 0;
}

export async function prismaLookupFlagCounts(
  pairs: { kind: SubjectKind; key: string }[],
): Promise<{
  count: number;
  reasons: string[];
  status: RegistryStatus;
  published: boolean;
}> {
  if (pairs.length === 0) {
    return { count: 0, reasons: [], status: "unverified", published: false };
  }

  const rows = await prisma.subject.findMany({
    where: {
      isPublished: true,
      OR: pairs.map((p) => ({
        kind: toSubjectKind(p.kind),
        key: p.key,
      })),
    },
    include: { flags: true },
  });

  let max = 0;
  let reasons: string[] = [];
  let status: RegistryStatus = "unverified";
  for (const s of rows) {
    if (s.flagCount > max) {
      max = s.flagCount;
      reasons = aggregateReasons(s.flags);
    }
    if (statusRank(s.status) > statusRank(status)) {
      status = s.status as RegistryStatus;
    }
  }
  return { count: max, reasons, status, published: rows.length > 0 };
}
