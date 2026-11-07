import Link from "next/link";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";

const modes = [
  {
    href: "/check?direction=job_offer",
    label: "Verify a job advert",
    body: "Pre-application check with risk score, evidence, and recommended next steps.",
    tone: "muted" as const,
    number: "01",
  },
  {
    href: "/skills",
    label: "Skill Match & quiz",
    body: "Compare your CV to a role, see gaps, then take a short domain quiz.",
    tone: "lime" as const,
    number: "02",
  },
  {
    href: "/offer",
    label: "Post-offer check",
    body: "Analyse an offer letter for green/red flags and draft clarification email.",
    tone: "white" as const,
    number: "03",
  },
  {
    href: "/bot",
    label: "Job Bot inbox",
    body: "Upload a batch. Blocked ads stay blocked. Eligible ones you apply to via the official portal.",
    tone: "ink" as const,
    number: "04",
  },
  {
    href: "/registry",
    label: "Community scam registry",
    body: "See who was flagged and why, with live flag counts and reasons.",
    tone: "white" as const,
    number: "05",
  },
];

export function ModeCards() {
  return (
    <section id="modes" className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8">
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionLabel>Tools for your next move</SectionLabel>
          <p className="mt-5 max-w-xl text-lg leading-7 text-kc-ink/75">
            A second look at the details can help you make a more confident decision.
          </p>
        </div>
        <Link href="/check?direction=applicant" className="min-h-11 self-start text-sm font-medium underline decoration-kc-ink/30 underline-offset-4 hover:decoration-kc-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kc-ink md:self-auto">
          Verify an applicant →
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {modes.map((mode) => (
          <Link key={mode.href} href={mode.href} className="block h-full rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kc-ink">
            <BrutalCard
              tone={mode.tone}
              className="group flex h-full min-h-[230px] flex-col justify-between rounded-3xl border border-kc-ink/10 p-6 shadow-[0_8px_28px_rgba(25,26,35,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(25,26,35,0.10)] sm:p-8"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${mode.tone === "ink" ? "bg-kc-lime text-[#191a23]" : "bg-kc-muted text-kc-ink"}`}>
                    {mode.number}
                  </span>
                  <span aria-hidden="true" className={`text-2xl transition-transform group-hover:translate-x-1 ${mode.tone === "ink" ? "text-kc-on-ink/80" : "text-kc-ink/60"}`}>↗</span>
                </div>
                <h3 className={`mt-7 text-2xl font-semibold tracking-tight ${mode.tone === "ink" ? "text-kc-on-ink" : "text-kc-ink"}`}>
                  {mode.label}
                </h3>
                <p className={`mt-3 max-w-sm leading-7 ${mode.tone === "ink" ? "text-kc-on-ink/75" : "text-kc-ink/70"}`}>
                  {mode.body}
                </p>
              </div>
              <span className={`mt-8 text-sm font-semibold ${mode.tone === "ink" ? "text-kc-lime" : "text-kc-ink"}`}>
                Explore tool <span aria-hidden="true">→</span>
              </span>
            </BrutalCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
