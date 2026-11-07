import { randomUUID } from "crypto";
import type {
  BotQueueItem,
  CheckDirection,
  CheckRecord,
  CreateCheckInput,
  EvidenceItem,
  Extracted,
  FlagInput,
  OfferAnalysisRecord,
  Finding,
  OfficialListingMatch,
  QuizResult,
  RegistryStatus,
  RegistrySubject,
  SkillMatchRecord,
  SubjectKind,
  SubjectRef,
  TrackerItem,
  TrackerStatus,
  Verdict,
  RiskBand,
} from "@/lib/types";
import { aggregateReasons } from "@/lib/store/reasons";
import { MOCK_SEED_SUBJECTS } from "@/lib/store/seed-data";

type SubjectRow = Omit<RegistrySubject, "recentFlags" | "topReasons"> & {
  flags: { fingerprintHash: string; reason: string; createdAt: string }[];
  topReasons: string[];
  recentFlags: { reason: string; createdAt: string }[];
};

type MemoryDb = {
  checks: Map<string, CheckRecord>;
  subjects: Map<string, SubjectRow>;
  skillMatches: Map<string, SkillMatchRecord>;
  quizzes: Map<string, QuizResult>;
  offers: Map<string, OfferAnalysisRecord>;
  tracker: Map<string, TrackerItem>;
  botQueue: Map<string, BotQueueItem>;
};

const globalStore = globalThis as unknown as { __kcStore?: MemoryDb };

function ensureStore(): MemoryDb {
  const existing = globalStore.__kcStore as MemoryDb | undefined;
  if (!existing) {
    const subjects = new Map<string, SubjectRow>();
    for (const s of MOCK_SEED_SUBJECTS) {
      subjects.set(s.id, {
        ...s,
        topReasons: s.topReasons ?? [],
        recentFlags: s.recentFlags ?? [],
        flags: (s.recentFlags ?? []).map((f, i) => ({
          fingerprintHash: `seed_${s.id}_${i}`,
          reason: f.reason,
          createdAt: f.createdAt,
        })),
      });
    }
    globalStore.__kcStore = {
      checks: new Map(),
      subjects,
      skillMatches: new Map(),
      quizzes: new Map(),
      offers: new Map(),
      tracker: new Map(),
      botQueue: new Map(),
    };
    return globalStore.__kcStore;
  }

  // HMR-safe: older process stores may miss newer maps/fields.
  existing.checks ??= new Map();
  existing.subjects ??= new Map();
  existing.skillMatches ??= new Map();
  existing.quizzes ??= new Map();
  existing.offers ??= new Map();
  existing.tracker ??= new Map();
  existing.botQueue ??= new Map();

  for (const [id, row] of existing.subjects) {
    row.flags ??= [];
    row.status ??= "unverified";
    row.isPublished ??= false;
    row.topReasons ??= aggregateReasons(row.flags);
    row.recentFlags ??= row.flags
      .slice()
      .reverse()
      .slice(0, 8)
      .map((f) => ({ reason: f.reason, createdAt: f.createdAt }));
    existing.subjects.set(id, row);
  }

  return existing;
}

function db(): MemoryDb {
  return ensureStore();
}

function toPublicSubject(row: SubjectRow): RegistrySubject {
  const flags = row.flags ?? [];
  const topReasons =
    (row.topReasons?.length ?? 0) > 0
      ? row.topReasons
      : aggregateReasons(flags);
  return {
    id: row.id,
    kind: row.kind,
    key: row.key,
    direction: row.direction,
    flagCount: row.flagCount ?? flags.length,
    summary: row.summary ?? "",
    lastFlaggedAt: row.lastFlaggedAt,
    status: row.status ?? "unverified",
    isPublished: row.isPublished ?? false,
    topReasons,
    recentFlags: flags
      .slice()
      .reverse()
      .slice(0, 8)
      .map((f) => ({ reason: f.reason, createdAt: f.createdAt })),
  };
}

export function memoryGetOrCreateSubject(
  kind: SubjectKind,
  key: string,
  direction: CheckDirection | null,
  summary = "",
): SubjectRow {
  const store = db();
  for (const s of store.subjects.values()) {
    if (s.kind === kind && s.key === key) return s;
  }
  const row: SubjectRow = {
    id: `sub_${randomUUID().slice(0, 8)}`,
    kind,
    key,
    direction,
    flagCount: 0,
    summary,
    lastFlaggedAt: null,
    status: "unverified",
    isPublished: false,
    topReasons: [],
    recentFlags: [],
    flags: [],
  };
  store.subjects.set(row.id, row);
  return row;
}

export function memoryCreateCheck(input: {
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
}): CheckRecord {
  const record: CheckRecord = {
    id: `chk_${randomUUID().slice(0, 10)}`,
    direction: input.direction,
    rawText: input.rawText,
    url: input.url,
    verdict: input.verdict,
    score: input.score,
    riskScore: input.riskScore,
    riskBand: input.riskBand,
    recommendedAction: input.recommendedAction,
    extracted: input.extracted,
    evidence: input.evidence,
    findings: input.findings ?? [],
    subjects: input.subjects,
    gaps: input.gaps,
    confirmYourself: input.confirmYourself,
    officialListing: input.officialListing,
    notifyPhone: input.notifyPhone ?? null,
    retroAlertedAt: null,
    createdAt: new Date().toISOString(),
  };
  db().checks.set(record.id, record);
  return record;
}

export function memoryGetCheck(id: string): CheckRecord | null {
  return db().checks.get(id) ?? null;
}

export function memoryListChecks(): CheckRecord[] {
  return [...db().checks.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function memoryUpdateCheck(
  id: string,
  patch: Partial<CheckRecord>,
): CheckRecord | null {
  const existing = db().checks.get(id);
  if (!existing) return null;
  const next = { ...existing, ...patch };
  db().checks.set(id, next);
  return next;
}

export function memoryListRegistry(
  direction?: CheckDirection,
): RegistrySubject[] {
  let rows = [...db().subjects.values()].filter(
    (s) => s.flagCount > 0 || s.summary,
  );
  if (direction) rows = rows.filter((s) => s.direction === direction);
  return rows
    .map(toPublicSubject)
    .sort((a, b) => b.flagCount - a.flagCount);
}

export function memoryGetSubject(id: string): RegistrySubject | null {
  const row = db().subjects.get(id);
  if (!row) return null;
  return toPublicSubject(row);
}

export function memoryAddFlag(input: FlagInput): {
  subjectId: string;
  flagCount: number;
  alreadyFlagged: boolean;
  reason: string;
  topReasons: string[];
} {
  const store = db();
  let subject: SubjectRow | undefined;
  const reason = (input.reason ?? "").trim() || "Flagged as scam without details";

  if (input.checkId) {
    const check = store.checks.get(input.checkId);
    const first = check?.subjects[0];
    if (first) subject = store.subjects.get(first.id);
  }

  if (!subject && input.kind && input.key) {
    subject = memoryGetOrCreateSubject(
      input.kind,
      input.key,
      null,
      reason,
    );
  }

  if (!subject) {
    throw new Error(
      "Subject not found: provide kind+key or checkId with subjects",
    );
  }

  const already = subject.flags.some(
    (f) => f.fingerprintHash === input.fingerprintHash,
  );
  if (already) {
    return {
      subjectId: subject.id,
      flagCount: subject.flagCount,
      alreadyFlagged: true,
      reason,
      topReasons: aggregateReasons(subject.flags),
    };
  }

  subject.flags.push({
    fingerprintHash: input.fingerprintHash,
    reason,
    createdAt: new Date().toISOString(),
  });
  subject.flagCount += 1;
  subject.lastFlaggedAt = new Date().toISOString().slice(0, 10);
  subject.topReasons = aggregateReasons(subject.flags);
  if (!subject.summary) subject.summary = reason;
  store.subjects.set(subject.id, subject);

  return {
    subjectId: subject.id,
    flagCount: subject.flagCount,
    alreadyFlagged: false,
    reason,
    topReasons: subject.topReasons,
  };
}

function statusRank(status: RegistryStatus | undefined): number {
  if (status === "confirmed") return 2;
  if (status === "under_investigation") return 1;
  return 0;
}

export function memoryLookupFlagCounts(
  pairs: { kind: SubjectKind; key: string }[],
): {
  count: number;
  reasons: string[];
  status: RegistryStatus;
  published: boolean;
} {
  const store = db();
  let max = 0;
  let reasons: string[] = [];
  let status: RegistryStatus = "unverified";
  let published = false;
  for (const p of pairs) {
    for (const s of store.subjects.values()) {
      if (s.kind !== p.kind || s.key !== p.key) continue;
      if (!s.isPublished) continue;
      published = true;
      if (s.flagCount > max) {
        max = s.flagCount;
        reasons = aggregateReasons(s.flags);
      }
      if (statusRank(s.status) > statusRank(status)) {
        status = s.status ?? "unverified";
      }
    }
  }
  return { count: max, reasons, status, published };
}

export function memorySaveSkillMatch(record: SkillMatchRecord) {
  db().skillMatches.set(record.id, record);
  return record;
}

export function memoryGetSkillMatch(id: string) {
  return db().skillMatches.get(id) ?? null;
}

export function memorySaveQuiz(result: QuizResult) {
  db().quizzes.set(result.id, result);
  return result;
}

export function memorySaveOffer(record: OfferAnalysisRecord) {
  db().offers.set(record.id, record);
  return record;
}

export function memoryGetOffer(id: string) {
  return db().offers.get(id) ?? null;
}

export function memoryListTracker(): TrackerItem[] {
  return [...db().tracker.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function memoryUpsertTracker(
  input: Partial<TrackerItem> & {
    title: string;
    employer: string;
  },
): TrackerItem {
  const store = db();
  const id = input.id ?? `trk_${randomUUID().slice(0, 8)}`;
  const existing = store.tracker.get(id);
  const now = new Date().toISOString();
  const item: TrackerItem = {
    id,
    title: input.title,
    employer: input.employer,
    source: input.source ?? existing?.source ?? "manual",
    verificationResult:
      input.verificationResult ?? existing?.verificationResult ?? "unchecked",
    checkId: input.checkId ?? existing?.checkId,
    status: (input.status as TrackerStatus) ?? existing?.status ?? "saved",
    notes: input.notes ?? existing?.notes ?? "",
    followUpDate: input.followUpDate ?? existing?.followUpDate,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  store.tracker.set(id, item);
  return item;
}

export function memoryDeleteTracker(id: string) {
  return db().tracker.delete(id);
}

export function memorySaveBotItem(item: BotQueueItem) {
  db().botQueue.set(item.id, item);
  return item;
}

export function memoryGetBotItem(id: string) {
  return db().botQueue.get(id) ?? null;
}

export function memoryListBotQueue(): BotQueueItem[] {
  return [...db().botQueue.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export type { CreateCheckInput };
