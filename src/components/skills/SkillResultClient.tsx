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

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-kc-ink">
                <th className="py-2 pr-3">Skill</th>
                <th className="py-2 pr-3">Requirement</th>
                <th className="py-2 pr-3">Your level</th>
                <th className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {record.gaps.map((g) => (
                <tr key={g.skill} className="border-b border-kc-ink/20">
                  <td className="py-3 pr-3 font-medium">{g.skill}</td>
                  <td className="py-3 pr-3">{g.requirement}</td>
                  <td className="py-3 pr-3">{g.assessment.replaceAll("_", " ")}</td>
                  <td className="py-3 text-kc-ink/75">{g.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
