import { createHash } from "crypto";
import { headers } from "next/headers";

/** Anonymous fingerprint for community flags (no login in v1). */
export async function getRequestFingerprint(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const ua = h.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${fwd}|${ua}`).digest("hex").slice(0, 32);
}
