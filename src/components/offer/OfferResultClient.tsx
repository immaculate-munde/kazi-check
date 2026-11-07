"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { trackerPrefillHref } from "@/lib/tracker/query";
import type { OfferAnalysisRecord } from "@/lib/types";
import { displayVerdict } from "@/lib/verdict";

export function OfferResultClient({ id }: { id: string }) {
  const [record, setRecord] = useState<OfferAnalysisRecord | null>(null);

  useEffect(() => {
    fetch(`/api/offers/${id}`)
      .then((r) => r.json())
      .then(setRecord);
  }, [id]);

  if (!record) {
    return <div className="mx-auto max-w-3xl px-5 py-14">Loading offer analysis…</div>;
  }

  const mailto = `mailto:?subject=${encodeURIComponent(record.emailDraft.subject)}&body=${encodeURIComponent(record.emailDraft.body)}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel>Offer report</SectionLabel>
      <BrutalCard className="mt-8" tone="white">
        <h1 className="text-3xl font-medium">{displayVerdict(record.verdict)}</h1>
        <p className="mt-2 text-kc-ink/75">
          Risk {record.riskScore}/100 · {record.riskBand.replaceAll("_", " ")}
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-medium">Green flags</h2>
          <ul className="mt-3 space-y-2">
            {record.greenFlags.length === 0 ? (
              <li className="text-sm text-kc-gray">None recorded yet.</li>
            ) : (
              record.greenFlags.map((f) => (
                <li key={f.ruleId} className="rounded-xl border-2 border-kc-ink bg-kc-muted px-3 py-2 text-sm">
                  <strong>{f.title}:</strong> {f.snippet}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium">Red flags</h2>
          <ul className="mt-3 space-y-2">
            {record.redFlags.length === 0 ? (
              <li className="text-sm text-kc-gray">No high-risk signals detected.</li>
            ) : (
              record.redFlags.map((f) => (
                <li key={`${f.ruleId}-${f.snippet}`} className="rounded-xl border-2 border-kc-ink bg-kc-muted px-3 py-2 text-sm">
                  <strong>{f.title}:</strong> {f.snippet}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium">Unresolved</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-kc-ink/80">
            {record.unresolved.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium">Questions to ask</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-kc-ink/80">
            {record.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border-2 border-kc-ink bg-kc-muted p-4">
          <h2 className="text-xl font-medium">Clarification email draft</h2>
          <p className="mt-2 text-sm font-medium">{record.emailDraft.subject}</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-kc-ink/80">
            {record.emailDraft.body}
          </pre>
          <a
            href={mailto}
            className="mt-4 inline-flex rounded-xl border-2 border-kc-ink bg-kc-ink px-5 py-3 text-kc-on-ink"
          >
            Open in your email app
          </a>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            href={trackerPrefillHref({
              title: record.extracted.jobTitle || "Offer letter",
              employer: record.extracted.employer || "Unknown employer",
              notes: `Offer verdict: ${record.verdict}`,
              verificationResult: `${record.verdict} (${record.riskScore}/100)`,
              source: "offer check",
              autosave: true,
            })}
            variant="outline"
          >
            Track this offer
          </Button>
          <Button href="/check?direction=job_offer" variant="solid">
            Check another advert
          </Button>
        </div>
      </BrutalCard>
    </div>
  );
}
