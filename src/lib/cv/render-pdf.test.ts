import { describe, expect, it } from "vitest";
import { cvFileName, renderCvPdf } from "@/lib/cv/render-pdf";
import { emptyProfile } from "@/lib/profile/types";

describe("renderCvPdf", () => {
  it("builds a PDF buffer with ATS-ish content", async () => {
    const profile = emptyProfile();
    profile.fullName = "Jane Wanjiku";
    profile.headline = "Operations associate";
    profile.skills = ["Excel", "Logistics"];
    profile.experience = [
      {
        title: "Operations Associate",
        company: "Acme KE",
        bullets: ["Coordinated deliveries in Nairobi"],
      },
    ];

    const pdf = await renderCvPdf({
      profile,
      roleTitle: "Operations Officer",
      matchBullets: ["Excel experience"],
    });
    expect(pdf.length).toBeGreaterThan(500);
    expect(pdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(cvFileName(profile, "Operations Officer")).toContain("Jane_Wanjiku");
  });
});
