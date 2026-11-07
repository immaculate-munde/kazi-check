import type { CheckDirection } from "@/lib/types";

export type TelegramSessionStep =
  | "idle"
  | "awaiting_offer"
  | "awaiting_applicant"
  | "awaiting_phone"
  | "awaiting_otp"
  | "awaiting_cv_text"
  | "awaiting_name";

export type TelegramSession = {
  step: TelegramSessionStep;
  lastCheckId?: string;
  pendingPhone?: string;
  pendingUserId?: string;
  updatedAt: number;
};

const TTL_MS = 30 * 60 * 1000;

const globalSessions = globalThis as unknown as {
  __kcTelegramSessions?: Map<number, TelegramSession>;
};

function store(): Map<number, TelegramSession> {
  globalSessions.__kcTelegramSessions ??= new Map();
  return globalSessions.__kcTelegramSessions;
}

export function getSession(chatId: number): TelegramSession {
  const map = store();
  const existing = map.get(chatId);
  const now = Date.now();
  if (!existing || now - existing.updatedAt > TTL_MS) {
    const fresh: TelegramSession = { step: "idle", updatedAt: now };
    map.set(chatId, fresh);
    return fresh;
  }
  return existing;
}

export function setSession(
  chatId: number,
  step: TelegramSessionStep,
  extra: Partial<
    Pick<TelegramSession, "lastCheckId" | "pendingPhone" | "pendingUserId">
  > = {},
): TelegramSession {
  const prior = getSession(chatId);
  const next: TelegramSession = {
    step,
    lastCheckId:
      extra.lastCheckId !== undefined ? extra.lastCheckId : prior.lastCheckId,
    pendingPhone:
      extra.pendingPhone !== undefined ? extra.pendingPhone : prior.pendingPhone,
    pendingUserId:
      extra.pendingUserId !== undefined
        ? extra.pendingUserId
        : prior.pendingUserId,
    updatedAt: Date.now(),
  };
  store().set(chatId, next);
  return next;
}

export function clearSession(chatId: number) {
  store().delete(chatId);
}

export function directionFromSession(chatId: number): CheckDirection {
  const step = getSession(chatId).step;
  if (step === "awaiting_applicant") return "applicant";
  return "job_offer";
}

export function resetTelegramSessionsForTests() {
  store().clear();
}
