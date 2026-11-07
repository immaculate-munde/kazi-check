import { createHash } from "crypto";
import { NextResponse } from "next/server";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_WRITES = 30;

type Bucket = number[];

const globalLimit = globalThis as unknown as { __kcRate?: Map<string, Bucket> };

function buckets(): Map<string, Bucket> {
  globalLimit.__kcRate ??= new Map();
  return globalLimit.__kcRate;
}

/** Hash the client IP. Raw addresses are not stored. */
export function hashClientIp(request: Request): string {
  const fwd =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip")?.trim() ??
    "local";
  return createHash("sha256").update(fwd).digest("hex").slice(0, 32);
}

export function checkIpRateLimit(
  ipHash: string,
  now = Date.now(),
  max = MAX_WRITES,
  windowMs = WINDOW_MS,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const map = buckets();
  const prior = (map.get(ipHash) ?? []).filter((t) => now - t < windowMs);
  if (prior.length >= max) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - prior[0])) / 1000));
    map.set(ipHash, prior);
    return { ok: false, retryAfterSec };
  }
  prior.push(now);
  map.set(ipHash, prior);
  return { ok: true };
}

export function resetIpRateLimitForTests() {
  buckets().clear();
}

export function rateLimitHeaders(retryAfterSec: number): HeadersInit {
  return { "Retry-After": String(retryAfterSec) };
}

export function ipRateLimitResponse(request: Request) {
  const result = checkIpRateLimit(hashClientIp(request));
  if (result.ok) return null;
  return NextResponse.json(
    { error: "Too many checks from this network. Try again shortly." },
    { status: 429, headers: rateLimitHeaders(result.retryAfterSec) },
  );
}
