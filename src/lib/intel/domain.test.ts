import { describe, expect, it } from "vitest";
import { collectDomainIntel, DOMAIN_AGE_POINTS } from "@/lib/intel/domain";
import { withExtraEvidence, runRules } from "@/lib/rules";
import { heuristicExtract } from "@/lib/extract";

const ACME =
  "Acme Roads Authority hiring 800 staff. Apply on WhatsApp. Send ID and Ksh 1,500 registration.";

describe("domain intel", () => {
  it("marks missing hosts as unknown, not a SCAM stamp", async () => {
    const extracted = heuristicExtract("job_offer", ACME);
    const intel = await collectDomainIntel(extracted);
    expect(intel.evidence[0]?.ruleId).toBe("domain_age");
    expect(intel.evidence[0]?.outcome).toBe("unknown");
    expect(intel.evidence[0]?.points).toBe(0);

    const rules = runRules("job_offer", extracted, 0, ACME);
    const merged = withExtraEvidence(rules, intel.evidence, ACME);
    expect(merged.verdict).toBe("SCAM");
    expect(merged.findings.some((f) => f.checkKey === "domain_age" && f.outcome === "unknown")).toBe(
      true,
    );
  });

  it("flags a recently registered domain without stacking SCAM", async () => {
    const text =
      "We are hiring at https://brand-new-careers.example — apply by email hr@brand-new-careers.example";
    const extracted = heuristicExtract("job_offer", text);
    const intel = await collectDomainIntel(extracted, {
      lookupRdap: async () => ({
        ok: true,
        registeredAt: new Date(Date.now() - 10 * 86_400_000),
        source: "https://rdap.org/domain/brand-new-careers.example",
      }),
      lookupMx: async () => ({ ok: true, hasMx: false }),
    });
    expect(intel.evidence.find((e) => e.ruleId === "domain_age")?.outcome).toBe("flagged");
    expect(intel.evidence.find((e) => e.ruleId === "domain_age")?.points).toBe(DOMAIN_AGE_POINTS);
    expect(intel.evidence.find((e) => e.ruleId === "dns_mx")?.outcome).toBe("flagged");
    expect(intel.evidence.find((e) => e.ruleId === "dns_mx")?.points).toBe(0);
    const rules = runRules("job_offer", extracted, 0, text);
    const merged = withExtraEvidence(rules, intel.evidence, text);
    expect(merged.verdict).not.toBe("SCAM");
  });

  it("passes official or free-mail hosts without RDAP", async () => {
    const text =
      "Safaricom PLC careers update: roles are posted only on https://www.safaricom.co.ke/careers. Never pay to apply.";
    const extracted = heuristicExtract("job_offer", text);
    const intel = await collectDomainIntel(extracted, {
      lookupRdap: async () => {
        throw new Error("official domains should not hit RDAP");
      },
      lookupMx: async () => {
        throw new Error("official domains should not hit MX");
      },
    });
    expect(intel.evidence[0]?.outcome).toBe("passed");
    expect(intel.findings[0]?.outcome).toBe("passed");
  });
});
