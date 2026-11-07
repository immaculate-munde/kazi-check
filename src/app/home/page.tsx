"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useRole } from "@/components/role/RoleProvider";

const seekerTools = [
  { href: "/check?direction=job_offer", label: "Check an advert", body: "Paste a message. Get a verdict and the official page.", intent: "check" },
  { href: "/skills", label: "Match your CV", body: "Compatibility is guidance, not a chance of hire.", intent: "match" },
  { href: "/bot", label: "Apply in a batch", body: "Blocked ads stay blocked. Eligible ones open the official portal.", intent: "apply" },
  { href: "/offer", label: "Read an offer", body: "Fees, gaps, and questions before you accept.", intent: "offer" },
  { href: "/tracker", label: "Track roles", body: "Saved opportunities after you checked them.", intent: "track" },
  { href: "/registry", label: "Registry", body: "Who the community already flagged.", intent: "registry" },
];

const recruiterTools = [
  { href: "/check?direction=applicant", label: "Check an applicant", body: "Paste outreach or claims. Same engine. Never SAFE.", intent: "applicant" },
  { href: "/registry", label: "Browse flags", body: "Community reports. Context, not proof.", intent: "registry" },
];

export default function HomeDashboardPage() {
  const router = useRouter();
  const { ready, role, onboarded, intent } = useRole();

  useEffect(() => {
    if (!ready) return;
    if (!role) {
      router.replace("/start");
      return;
    }
    if (!onboarded) {
      router.replace(role === "recruiter" ? "/start/recruiter" : "/start/seeker");
    }
  }, [ready, role, onboarded, router]);

  if (!ready || !role || !onboarded) {
    return (
      <div className="kc-page">
        <p className="text-sm text-foreground/60">Opening your workspace…</p>
      </div>
    );
  }

  const tools = role === "recruiter" ? recruiterTools : seekerTools;
  const featured = tools.find((tool) => tool.intent === intent) ?? tools[0];
  const rest = tools.filter((tool) => tool.href !== featured.href);

  return (
    <div className="kc-page">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
        {role === "recruiter" ? "Recruiter dashboard" : "Job seeker dashboard"}
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {role === "recruiter" ? "Verify applicants before you trust the file." : "Verify first. Then decide."}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-foreground/70">
        {role === "recruiter"
          ? "Paste applicant outreach, then confirm anything important on an official channel. This app never labels anyone SAFE."
          : "Paste the advert, read the verdict, use the official careers page. Never pay to get a job."}
      </p>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Link href={featured.href} className="kc-glass flex min-h-[220px] flex-col justify-between p-6 sm:p-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kc-teal">Start here</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{featured.label}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-foreground/70">{featured.body}</p>
          </div>
          <span className="mt-6 text-sm font-semibold text-kc-teal">Open →</span>
        </Link>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="kc-tile p-5">
            <p className="text-sm text-foreground/55">Checks this session</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
          <div className="kc-tile p-5">
            <p className="text-sm text-foreground/55">Saved in tracker</p>
            <p className="mt-2 text-3xl font-semibold">—</p>
          </div>
          <div className="kc-tile p-5">
            <p className="text-sm text-foreground/55">Rule</p>
            <p className="mt-2 text-lg font-semibold">Never SAFE</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rest.map((tool) => (
          <Link key={tool.href} href={tool.href} className="kc-glass p-5 transition hover:-translate-y-0.5">
            <h3 className="text-lg font-semibold tracking-tight">{tool.label}</h3>
            <p className="mt-2 text-sm leading-6 text-foreground/70">{tool.body}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/start" variant="outline">
          Switch path
        </Button>
      </div>
    </div>
  );
}
