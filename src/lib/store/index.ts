import { prismaEnabled } from "@/lib/db";
import type {
  BotQueueItem,
  CheckDirection,
  CheckRecord,
  EvidenceItem,
  Extracted,
  Finding,
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
  memoryGetBotItem,
  memoryGetCheck,
  memoryGetOrCreateSubject,
  memoryGetSubject,
  memoryListBotQueue,
  memoryListChecks,
  memoryListRegistry,
  memoryLookupFlagCounts,
  memorySaveBotItem,
  memoryUpdateCheck,
} from "@/lib/store/memory";
import {
  prismaAddFlag,
  prismaCreateCheck,
  prismaGetBotItem,
  prismaGetCheck,
  prismaGetOrCreateSubject,
  prismaGetSubject,
  prismaListBotQueue,
  prismaListChecks,
  prismaListRegistry,
  prismaLookupFlagCounts,
  prismaSaveBotItem,
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
  findings?: Finding[];
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
  if (prismaEnabled()) {
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
  if (prismaEnabled()) return prismaCreateCheck(input);
  return memoryCreateCheck(input);
}

export async function getCheck(id: string): Promise<CheckRecord | null> {
  if (prismaEnabled()) return prismaGetCheck(id);
  return memoryGetCheck(id);
}

export async function listChecks(): Promise<CheckRecord[]> {
  if (prismaEnabled()) return prismaListChecks();
  return memoryListChecks();
}

export async function updateCheck(
  id: string,
  patch: Partial<CheckRecord>,
): Promise<CheckRecord | null> {
  if (prismaEnabled()) return prismaUpdateCheck(id, patch);
  return memoryUpdateCheck(id, patch);
}

export async function listRegistry(
  direction?: CheckDirection,
): Promise<RegistrySubject[]> {
  if (prismaEnabled()) return prismaListRegistry(direction);
  return memoryListRegistry(direction);
}

export async function getSubject(
  id: string,
): Promise<RegistrySubject | null> {
  if (prismaEnabled()) return prismaGetSubject(id);
  return memoryGetSubject(id);
}

export async function addFlag(input: FlagInput) {
  if (prismaEnabled()) return prismaAddFlag(input);
  return memoryAddFlag(input);
}

export async function lookupFlagCounts(
  pairs: { kind: SubjectKind; key: string }[],
) {
  if (prismaEnabled()) return prismaLookupFlagCounts(pairs);
  return memoryLookupFlagCounts(pairs);
}

export function storeBackend(): "prisma" | "memory" {
  return prismaEnabled() ? "prisma" : "memory";
}

export async function saveBotItem(item: BotQueueItem): Promise<BotQueueItem> {
  if (prismaEnabled()) return prismaSaveBotItem(item);
  return memorySaveBotItem(item);
}

export async function getBotItem(id: string): Promise<BotQueueItem | null> {
  if (prismaEnabled()) return prismaGetBotItem(id);
  return memoryGetBotItem(id);
}

export async function listBotQueue(): Promise<BotQueueItem[]> {
  if (prismaEnabled()) return prismaListBotQueue();
  return memoryListBotQueue();
}
