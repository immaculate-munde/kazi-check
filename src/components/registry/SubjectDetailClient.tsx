"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { FlagCountPill } from "@/components/ui/FlagCountPill";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { RegistrySubject } from "@/lib/types";

export function SubjectDetailClient({ subjectId }: { subjectId: string }) {
  const [subject, setSubject] = useState<RegistrySubject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/registry/${subjectId}`);
      const data = await res.json();
      if (!cancelled) {
        if (!res.ok) setError(data.error ?? "Not found");
        else setSubject(data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p>{error}</p>
        <Button href="/registry" className="mt-6" variant="outline">
          Back
        </Button>
      </div>
    );
  }

  if (!subject) {
    return <div className="mx-auto max-w-3xl px-5 py-14">Loading…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <Link href="/registry" className="text-sm font-medium underline">
        ← Back to registry
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SectionLabel>Flagged subject</SectionLabel>
        <FlagCountPill count={subject.flagCount} />
      </div>

      <BrutalCard className="mt-8" tone="muted">
        <p className="text-sm uppercase tracking-wide text-kc-gray">
          {subject.kind} ·{" "}
          {subject.direction === "applicant" ? "applicant" : "recruiter / offer"}
        </p>
        <h1 className="mt-2 break-all text-3xl font-medium md:text-4xl">
          {subject.key}
        </h1>
        <p className="mt-4 text-lg text-kc-ink/80">{subject.summary}</p>
        <p className="mt-2 text-sm text-kc-gray">
          {subject.lastFlaggedAt
            ? `Last flagged ${subject.lastFlaggedAt}`
            : "Not flagged yet"}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            href={`/check?direction=${subject.direction ?? "job_offer"}`}
            variant="solid"
          >
            Run a fresh check
          </Button>
          <Button href="/registry" variant="outline">
            All subjects
          </Button>
        </div>
      </BrutalCard>
    </div>
  );
}
