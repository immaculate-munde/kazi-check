import { usePrisma } from "@/lib/db";
import type {
  CheckDirection,
  CheckRecord,
  EvidenceItem,
  Extracted,
  FlagInput,
  OfficialListingMatch,
  RegistrySubject,
  RiskBand,
  SubjectKind,
  SubjectRef,
  Verdict,
} from "@/lib/types";
import {
  memoryAddFlag,
  memoryCreateCheck,
  memoryGetCheck,
  memoryGetOrCreateSubject,
  memoryGetSubject,
  memoryListChecks,
  memoryListRegistry,
  memoryLookupFlagCounts,
  memoryUpdateCheck,
} from "@/lib/store/memory";
import {
  prismaAddFlag,
  prismaCreateCheck,
  prismaGetCheck,
  prismaGetOrCreateSubject,
  prismaGetSubject,
  prismaListChecks,
  prismaListRegistry,
  prismaLookupFlagCounts,
  prismaUpdateCheck,
} from "@/lib/store/prisma-store";

export type CreateCheckStoreInput = {
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
  subjects: SubjectRef[];
  gaps: string[];
  confirmYourself: string[];
  officialListing?: OfficialListingMatch;
  notifyPhone?: string | null;
};

export async function getOrCreateSubject(
  kind: SubjectKind,
  key: string,
  direction: CheckDirection | null,
  summary = "",
) {
  if (usePrisma()) {
    return prismaGetOrCreateSubject(kind, key, direction, summary);
  }
  const row = memoryGetOrCreateSubject(kind, key, direction, summary);
  return {
    id: row.id,
    kind: row.kind,
    key: row.key,
    flagCount: row.flagCount,
    topReasons: row.topReasons,
  };
}

export async function createCheck(
  input: CreateCheckStoreInput,
): Promise<CheckRecord> {
  if (usePrisma()) return prismaCreateCheck(input);
  return memoryCreateCheck(input);
}

export async function getCheck(id: string): Promise<CheckRecord | null> {
  if (usePrisma()) return prismaGetCheck(id);
  return memoryGetCheck(id);
}

export async function listChecks(): Promise<CheckRecord[]> {
  if (usePrisma()) return prismaListChecks();
  return memoryListChecks();
}

export async function updateCheck(
  id: string,
  patch: Partial<CheckRecord>,
): Promise<CheckRecord | null> {
  if (usePrisma()) return prismaUpdateCheck(id, patch);
  return memoryUpdateCheck(id, patch);
}

export async function listRegistry(
  direction?: CheckDirection,
): Promise<RegistrySubject[]> {
  if (usePrisma()) return prismaListRegistry(direction);
  return memoryListRegistry(direction);
}

export async function getSubject(
  id: string,
): Promise<RegistrySubject | null> {
  if (usePrisma()) return prismaGetSubject(id);
  return memoryGetSubject(id);
}

export async function addFlag(input: FlagInput) {
  if (usePrisma()) return prismaAddFlag(input);
  return memoryAddFlag(input);
}

export async function lookupFlagCounts(
  pairs: { kind: SubjectKind; key: string }[],
) {
  if (usePrisma()) return prismaLookupFlagCounts(pairs);
  return memoryLookupFlagCounts(pairs);
}

export function storeBackend(): "prisma" | "memory" {
  return usePrisma() ? "prisma" : "memory";
}
