"use client";

import Link from "next/link";
import { useRole } from "@/components/role/RoleProvider";

export default function StartPage() {
  const { setRole } = useRole();

  return (
    <div className="kc-page mx-auto flex max-w-4xl flex-1 flex-col justify-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">Onboarding</p>
      <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Who are you today?
      </h1>
      <p className="mt-3 max-w-lg text-base leading-7 text-foreground/70">
        Two paths. A short setup. Then a dashboard with only the tools you need.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Link
          href="/start/seeker"
          onClick={() => setRole("seeker")}
          className="kc-glass flex min-h-[220px] flex-col justify-between p-6 transition hover:-translate-y-0.5 sm:p-8"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kc-teal">Applier</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">I’m applying for a job</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/70">
              Check adverts, match your CV, apply on official portals, and read offer letters before you pay anyone.
            </p>
          </div>
          <span className="mt-6 text-sm font-semibold text-kc-teal">Continue →</span>
        </Link>
        <Link
          href="/start/recruiter"
          onClick={() => setRole("recruiter")}
          className="kc-glass flex min-h-[220px] flex-col justify-between p-6 transition hover:-translate-y-0.5 sm:p-8"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kc-teal">Recruiter</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">I’m hiring</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/70">
              Check applicant outreach and claims. Same engine. Still never labelled SAFE.
            </p>
          </div>
          <span className="mt-6 text-sm font-semibold text-kc-teal">Continue →</span>
        </Link>
      </div>
    </div>
  );
}
