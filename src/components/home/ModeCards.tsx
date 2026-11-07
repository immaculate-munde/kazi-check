import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionLabel";

const featured = {
  href: "/check?direction=job_offer",
  label: "Verify a job advert",
  body: "Paste the message. Get a verdict, flagged evidence, and the official careers page — before you reply or pay.",
  cta: "Start a check",
};

const modes = [
  {
    href: "/bot",
    label: "Job Bot",
    body: "Check a batch. Blocked ads stay blocked.",
  },
  {
    href: "/offer",
    label: "Offer letter",
    body: "Read an offer for fees, gaps, and questions to ask.",
  },
  {
    href: "/skills",
    label: "Skill match",
    body: "Compare your CV to a role, then take a short quiz.",
  },
  {
    href: "/registry",
    label: "Registry",
    body: "See who the community already flagged, and why.",
  },
];

export function ModeCards() {
  return (
    <section id="modes" className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionLabel>Choose a starting point</SectionLabel>
          <h2 className="mt-3 max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
            One decision at a time.
          </h2>
        </div>
        <Link href="/check?direction=applicant" className="min-h-11 self-start text-sm font-medium text-kc-ink/70 underline decoration-kc-ink/25 underline-offset-4 hover:text-kc-ink hover:decoration-kc-ink md:self-auto">
          Verify an applicant →
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Link
          href={featured.href}
          className="kc-cream group flex min-h-[240px] flex-col justify-between p-6 text-kc-ink transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:p-8 lg:col-span-3"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-kc-ink/55">Most people start here</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{featured.label}</h3>
            <p className="mt-3 max-w-md text-base leading-7 text-kc-ink/75">{featured.body}</p>
          </div>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">
            {featured.cta}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
          {modes.map((mode) => (
            <Link
              key={mode.href}
              href={mode.href}
              className="kc-cream group p-5 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-tight">{mode.label}</h3>
                <span aria-hidden="true" className="text-kc-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-kc-ink">↗</span>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-kc-ink/65">{mode.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
