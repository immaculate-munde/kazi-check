import { describe, expect, it, beforeEach } from "vitest";
import {
  checkIpRateLimit,
  hashClientIp,
  resetIpRateLimitForTests,
} from "@/lib/http/rate-limit";

describe("IP hash rate limit", () => {
  beforeEach(() => {
    resetIpRateLimitForTests();
  });

  it("hashes the IP and never returns the raw address", () => {
    const request = new Request("http://localhost/api/checks", {
      headers: { "x-forwarded-for": "203.0.113.9" },
    });
    const hash = hashClientIp(request);
    expect(hash).toHaveLength(32);
    expect(hash).not.toContain("203.0.113.9");
  });

  it("allows a burst then returns 429-shaped failure", () => {
    const hash = "abc123";
    for (let i = 0; i < 30; i += 1) {
      expect(checkIpRateLimit(hash, 1_000 + i).ok).toBe(true);
    }
    const blocked = checkIpRateLimit(hash, 1_040);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});
