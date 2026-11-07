import { randomUUID } from "crypto";
import type {
  CheckDirection,
  CheckRecord,
  CreateCheckInput,
  EvidenceItem,
  Extracted,
  FlagInput,
  RegistrySubject,
  SubjectKind,
  SubjectRef,
  Verdict,
} from "@/lib/types";
import { MOCK_SEED_SUBJECTS } from "@/lib/store/seed-data";

type SubjectRow = RegistrySubject & {
  flags: { fingerprintHash: string; reason?: string | null; createdAt: string }[];
};

type MemoryDb = {
  checks: Map<string, CheckRecord>;
  subjects: Map<string, SubjectRow>;
};

const globalStore = globalThis as unknown as { __kcStore?: MemoryDb };

function db(): MemoryDb {
  if (!globalStore.__kcStore) {
    const subjects = new Map<string, SubjectRow>();
    for (const s of MOCK_SEED_SUBJECTS) {
      subjects.set(s.id, { ...s, flags: [] });
    }
    globalStore.__kcStore = {
      checks: new Map(),
      subjects,
    };
  }
  return globalStore.__kcStore;
}

function subjectKey(kind: SubjectKind, key: string) {
  return `${kind}:${key}`;
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
  extracted: Extracted;
  evidence: EvidenceItem[];
  subjects: SubjectRef[];
}): CheckRecord {
  const record: CheckRecord = {
    id: `chk_${randomUUID().slice(0, 10)}`,
    direction: input.direction,
    rawText: input.rawText,
    url: input.url,
    verdict: input.verdict,
    score: input.score,
    extracted: input.extracted,
    evidence: input.evidence,
    subjects: input.subjects,
    createdAt: new Date().toISOString(),
  };
  db().checks.set(record.id, record);
  return record;
}

export function memoryGetCheck(id: string): CheckRecord | null {
  return db().checks.get(id) ?? null;
}

export function memoryListRegistry(
  direction?: CheckDirection,
): RegistrySubject[] {
  let rows = [...db().subjects.values()].filter((s) => s.flagCount > 0 || s.summary);
  if (direction) rows = rows.filter((s) => s.direction === direction);
  return rows
    .map(({ flags: _f, ...rest }) => rest)
    .sort((a, b) => b.flagCount - a.flagCount);
}

export function memoryGetSubject(id: string): RegistrySubject | null {
  const row = db().subjects.get(id);
  if (!row) return null;
  const { flags: _f, ...rest } = row;
  return rest;
}

export function memoryAddFlag(input: FlagInput): {
  subjectId: string;
  flagCount: number;
  alreadyFlagged: boolean;
} {
  const store = db();
  let subject: SubjectRow | undefined;

  if (input.checkId) {
    const check = store.checks.get(input.checkId);
    const first = check?.subjects[0];
    if (first) subject = store.subjects.get(first.id);
  }

  if (!subject && input.kind && input.key) {
    subject = memoryGetOrCreateSubject(input.kind, input.key, null, input.reason ?? "");
  }

  if (!subject) {
    throw new Error("Subject not found — provide kind+key or checkId with subjects");
  }

  const already = subject.flags.some((f) => f.fingerprintHash === input.fingerprintHash);
  if (already) {
    return {
      subjectId: subject.id,
      flagCount: subject.flagCount,
      alreadyFlagged: true,
    };
  }

  subject.flags.push({
    fingerprintHash: input.fingerprintHash,
    reason: input.reason,
    createdAt: new Date().toISOString(),
  });
  subject.flagCount += 1;
  subject.lastFlaggedAt = new Date().toISOString().slice(0, 10);
  if (input.reason && !subject.summary) subject.summary = input.reason;
  store.subjects.set(subject.id, subject);

  return {
    subjectId: subject.id,
    flagCount: subject.flagCount,
    alreadyFlagged: false,
  };
}

export function memoryLookupFlagCounts(
  pairs: { kind: SubjectKind; key: string }[],
): number {
  const store = db();
  let max = 0;
  for (const p of pairs) {
    for (const s of store.subjects.values()) {
      if (s.kind === p.kind && s.key === p.key) {
        max = Math.max(max, s.flagCount);
      }
    }
  }
  return max;
}

export type { CreateCheckInput };
