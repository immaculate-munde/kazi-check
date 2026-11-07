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
  const [reason, setReason] = useState("Asked for interview / application fee");
  const [flagMsg, setFlagMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/registry/${subjectId}`);
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) setError(data.error ?? "Not found");
      else setSubject(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  async function reload() {
    const res = await fetch(`/api/registry/${subjectId}`);
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Not found");
    else setSubject(data);
  }

  async function flagAgain() {
    if (!subject) return;
    const res = await fetch("/api/subjects/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: subject.kind,
        key: subject.key,
        reason,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setFlagMsg(
        data.alreadyFlagged
          ? "You already flagged this from this browser."
          : `Flagged. Now ${data.flagCount} flags.`,
      );
      await reload();
    }
  }

  if (error) {
    return (
      <div className="kc-page">
        <p>{error}</p>
        <Button href="/registry" className="mt-6" variant="outline">
          Back
        </Button>
      </div>
    );
  }

  if (!subject) {
    return <div className="kc-page">Loading…</div>;
  }

  return (
    <div className="kc-page">
      <Link href="/registry" className="text-sm font-medium underline">
        ← Back to registry
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SectionLabel>Flagged subject</SectionLabel>
        <FlagCountPill count={subject.flagCount} />
      </div>

      <BrutalCard className="mt-8" tone="white">
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

        <div className="mt-8">
          <h2 className="text-lg font-medium">Why it was flagged</h2>
          <ul className="mt-3 space-y-2">
            {(subject.topReasons.length > 0
              ? subject.topReasons
              : ["No detailed reason recorded yet"]
            ).map((r) => (
              <li
                key={r}
                className="rounded-xl border border-kc-ink/10 bg-kc-white px-3 py-2 text-sm"
              >
                {r}
              </li>
            ))}
          </ul>
        </div>

        {subject.recentFlags.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-kc-gray">Recent flags</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {subject.recentFlags.map((f, i) => (
                <li key={`${f.createdAt}-${i}`}>
                  {f.reason}{" "}
                  <span className="text-kc-gray">
                    · {new Date(f.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 space-y-3 rounded-2xl border border-kc-ink/10 bg-kc-white p-4">
          <p className="font-medium">Add your flag with a reason</p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="kc-field"
          />
          <Button variant="solid" onClick={flagAgain}>
            Flag as scam
          </Button>
          {flagMsg ? <p className="text-sm text-kc-ink/75">{flagMsg}</p> : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            href={`/check?direction=${subject.direction === "applicant" ? "applicant" : "job_offer"}`}
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
