import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "kc_seeker";
const MAX_AGE_SEC = 60 * 60 * 24 * 30;

function secret(): string {
  return (
    process.env.SEEKER_SESSION_SECRET?.trim() ||
    process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ||
    "dev-seeker-session"
  );
}

export function seekerCookieName() {
  return COOKIE;
}

export function signSeekerSession(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, t: Date.now() })).toString(
    "base64url",
  );
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readSeekerSession(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      uid?: string;
      t?: number;
    };
    if (!data.uid) return null;
    if (data.t && Date.now() - data.t > MAX_AGE_SEC * 1000) return null;
    return data.uid;
  } catch {
    return null;
  }
}

export function seekerCookieHeader(userId: string): string {
  const value = signSeekerSession(userId);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearSeekerCookieHeader(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
