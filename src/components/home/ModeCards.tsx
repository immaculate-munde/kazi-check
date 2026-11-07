import Link from "next/link";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";

const modes = [
  {
    href: "/check?direction=job_offer",
    label: "Check a job offer",
    body: "Paste a Telegram, WhatsApp, or email job ad. We extract signals and run scam rules.",
    tone: "muted" as const,
    icon: "↓",
  },
  {
    href: "/check?direction=applicant",
    label: "Check an applicant",
    body: "Hiring? Paste outreach or CV claims and see if the candidate looks credible.",
    tone: "lime" as const,
    icon: "↓",
  },
  {
    href: "/registry",
    label: "Browse flagged recruiters",
    body: "See who the community has already flagged — with live flag counts.",
    tone: "ink" as const,
    icon: "→",
  },
];

export function ModeCards() {
  return (
    <section id="modes" className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8">
      <div className="mb-10 max-w-xl">
        <SectionLabel>Services</SectionLabel>
        <p className="mt-6 text-lg text-kc-ink/80">
          Two-way trust: seekers verify offers, hirers verify applicants, and
          anyone can strengthen the community registry.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {modes.map((mode, i) => (
          <Link
            key={mode.href}
            href={mode.href}
            className={i === 2 ? "md:col-span-2 lg:col-span-1" : undefined}
          >
            <BrutalCard
              tone={mode.tone}
              className="flex h-full min-h-[220px] flex-col justify-between transition hover:-translate-y-0.5"
            >
              <div>
                <SectionLabel>{mode.label}</SectionLabel>
                <p
                  className={`mt-6 max-w-sm text-lg ${
                    mode.tone === "ink" ? "text-white/80" : "text-kc-ink/80"
                  }`}
                >
                  {mode.body}
                </p>
              </div>
              <span className="mt-8 inline-flex items-center gap-3 text-base font-medium">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    mode.tone === "ink"
                      ? "border-white bg-kc-lime text-kc-ink"
                      : "border-kc-ink bg-kc-ink text-white"
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
