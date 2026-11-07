import Link from "next/link";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";

const modes = [
  {
    href: "/check?direction=job_offer",
    label: "Verify a job advert",
    body: "Pre-application check with risk score, evidence, and recommended next steps.",
    tone: "muted" as const,
    icon: "↓",
  },
  {
    href: "/skills",
    label: "Skill Match & quiz",
    body: "Compare your CV to a role, see gaps, then take a short domain quiz.",
    tone: "lime" as const,
    icon: "↓",
  },
  {
    href: "/offer",
    label: "Post-offer check",
    body: "Analyse an offer letter for green/red flags and draft clarification email.",
    tone: "white" as const,
    icon: "↓",
  },
  {
    href: "/registry",
    label: "Community scam registry",
    body: "See who was flagged and why, with live flag counts and reasons.",
    tone: "ink" as const,
    icon: "→",
  },
];

export function ModeCards() {
  return (
    <section id="modes" className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8">
      <div className="mb-10 max-w-xl">
        <SectionLabel>Verify. Match. Proceed.</SectionLabel>
        <p className="mt-6 text-lg text-kc-ink/80">
          Job-seeker protection and career guidance: check adverts, match skills,
          and assess offers before you act.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {modes.map((mode) => (
          <Link key={mode.href} href={mode.href}>
            <BrutalCard
              tone={mode.tone}
              className="flex h-full min-h-[220px] flex-col justify-between transition hover:-translate-y-0.5"
            >
              <div>
                <SectionLabel>{mode.label}</SectionLabel>
                <p
                  className={`mt-6 max-w-sm text-lg ${
                    mode.tone === "ink" ? "text-kc-on-ink/80" : "text-kc-ink/80"
                  }`}
                >
                  {mode.body}
                </p>
              </div>
              <span className="mt-8 inline-flex items-center gap-3 text-base font-medium">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    mode.tone === "ink"
                      ? "border-kc-on-ink bg-kc-lime text-[#191a23]"
                      : "border-kc-ink bg-kc-ink text-kc-on-ink"
                  }`}
                >
                  {mode.icon}
                </span>
                Learn more
              </span>
            </BrutalCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
