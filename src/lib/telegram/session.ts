export type TelegramSessionStep =
  | "idle"
  | "awaiting_offer"
  | "awaiting_applicant";

export type TelegramSession = {
  step: TelegramSessionStep;
  updatedAt: number;
};

const TTL_MS = 15 * 60 * 1000;

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
): TelegramSession {
  const next: TelegramSession = { step, updatedAt: Date.now() };
  store().set(chatId, next);
  return next;
}

export function clearSession(chatId: number) {
  store().delete(chatId);
}

export function resetTelegramSessionsForTests() {
  store().clear();
}
