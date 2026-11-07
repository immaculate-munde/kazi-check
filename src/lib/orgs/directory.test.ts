import { describe, expect, it } from "vitest";
import { findOrganisation, loadOfficialListings } from "@/lib/orgs/directory";

describe("organisation directory", () => {
  it("indexes Safaricom and Kenya Defence Forces", () => {
    const names = loadOfficialListings().map((row) => row.orgName);
    expect(names).toContain("Safaricom");
    expect(names).toContain("Kenya Defence Forces");
  });

  it("resolves aliases to the official apply URL", () => {
    const safaricom = findOrganisation("Safaricom PLC");
    expect(safaricom?.applyUrl).toContain("safaricom.co.ke/careers");
    const kdf = findOrganisation("KDF");
    expect(kdf?.officialDomain).toBe("mod.go.ke");
    expect(kdf?.chargesFee).toBe(false);
  });

  it("returns null for an org we have not indexed", () => {
    expect(findOrganisation("Sunrise Tea Cooperative")).toBeNull();
  });
});
