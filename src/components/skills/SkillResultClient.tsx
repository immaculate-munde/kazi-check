"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { trackerPrefillHref } from "@/lib/tracker/query";
import type { SkillMatchRecord } from "@/lib/types";

export function SkillResultClient({ id }: { id: string }) {
  const [record, setRecord] = useState<SkillMatchRecord | null>(null);

  useEffect(() => {
    fetch(`/api/skills/match/${id}`)
      .then((r) => r.json())
      .then(setRecord)
      .catch(() => setRecord(null));
  }, [id]);

  if (!record) {
    return <div className="mx-auto max-w-3xl px-5 py-14">Loading skill match…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel>Skill Match report</SectionLabel>
      <BrutalCard className="mt-8" tone="white">
        <h1 className="text-3xl font-medium">{record.jobTitle}</h1>
        <p className="mt-2 text-kc-ink/75">
          Compatibility score: <strong>{record.compatibilityScore}%</strong> (not
          a chance-of-hire)
        </p>

        <div className="mt-8">
          <h2 className="sr-only">Skill requirement breakdown</h2>
          <div className="space-y-3 md:hidden">
            {record.gaps.map((g) => (
              <article key={g.skill} className="rounded-2xl border border-kc-ink/10 bg-kc-muted/60 p-4">
                <h2 className="break-words text-base font-semibold">{g.skill}</h2>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-kc-gray">Requirement</dt>
                    <dd className="mt-1 break-words">{g.requirement}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-kc-gray">Your level</dt>
                    <dd className="mt-1 break-words capitalize">{g.assessment.replaceAll("_", " ")}</dd>
                  </div>
                  <div className="col-span-2 border-t border-kc-ink/10 pt-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-kc-gray">Note</dt>
                    <dd className="mt-1 break-words text-kc-ink/75">{g.note}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-2xl border border-kc-ink/10 md:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Skill requirements and your assessed levels</caption>
              <thead>
                <tr className="border-b border-kc-ink/10 bg-kc-muted text-xs uppercase tracking-wide text-kc-gray">
                  <th scope="col" className="px-4 py-3">Skill</th>
                  <th scope="col" className="px-4 py-3">Requirement</th>
                  <th scope="col" className="px-4 py-3">Your level</th>
                  <th scope="col" className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {record.gaps.map((g, index) => (
                  <tr key={g.skill} className={`align-top ${index < record.gaps.length - 1 ? "border-b border-kc-ink/10" : ""}`}>
                    <th scope="row" className="px-4 py-4 font-semibold">{g.skill}</th>
                    <td className="px-4 py-4">{g.requirement}</td>
                    <td className="px-4 py-4 capitalize">{g.assessment.replaceAll("_", " ")}</td>
                    <td className="max-w-xs break-words px-4 py-4 text-kc-ink/75">{g.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-medium">Learning roadmap</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-kc-ink/80">
            {record.roadmap.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/quiz" variant="solid">
            Take domain quiz
          </Button>
          <Button
            href={trackerPrefillHref({
              title: record.jobTitle || "Skill-matched role",
              employer: "From skill match",
              notes: `Compatibility ${record.compatibilityScore}%`,
              checkId: record.checkId,
              verificationResult: `Skill match ${record.compatibilityScore}%`,
              source: "skill match",
              autosave: true,
            })}
            variant="outline"
          >
            Track this role
          </Button>
        </div>
      </BrutalCard>
    </div>
  );
}
