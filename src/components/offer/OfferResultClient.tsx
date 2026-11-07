"use client";

import { useEffect, useState } from "react";
import { FindingRow } from "@/components/check/FindingRow";
import { RiskScoreBanner } from "@/components/check/RiskScoreBanner";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { trackerPrefillHref } from "@/lib/tracker/query";
import type { OfferAnalysisRecord } from "@/lib/types";

export function OfferResultClient({ id }: { id: string }) {
  const [record, setRecord] = useState<OfferAnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/offers/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Offer analysis not found");
        if (!cancelled) setRecord(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the offer analysis.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, retryCount]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-14" aria-busy="true" aria-label="Loading offer analysis">
        <div className="h-44 animate-pulse rounded-3xl bg-kc-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-kc-muted" />
        <p className="sr-only" role="status">Loading offer findings…</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 md:px-8" role="alert">
        <BrutalCard tone="white" className="border-red-200 shadow-none">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-800">Offer check unavailable</p>
          <h1 className="mt-2 text-2xl font-semibold">We couldn’t open this analysis.</h1>
          <p className="mt-3 text-kc-ink/75">{error ?? "Offer analysis not found"}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</Button>
            <Button href="/offer" variant="outline">Start a new check</Button>
          </div>
        </BrutalCard>
      </div>
    );
  }

  const mailto = `mailto:?subject=${encodeURIComponent(record.emailDraft.subject)}&body=${encodeURIComponent(record.emailDraft.body)}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <div className="mb-5"><SectionLabel>Offer report</SectionLabel></div>
      <RiskScoreBanner riskBand={record.riskBand} riskScore={record.riskScore} direction="offer_letter" />
      <BrutalCard className="mt-6" tone="white">
        <p className="font-medium">{record.verdict.replaceAll("_", " ")}</p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Supporting details</h2>
          <ul className="mt-3 space-y-2">
            {record.greenFlags.length === 0 ? (
              <li><FindingRow title="Supporting details" status="Not determined" points={null} explanation="No supporting details were extracted from this offer." source="Offer letter analysis" /></li>
            ) : (
              record.greenFlags.map((f) => (
              <FindingRow key={f.ruleId} title={f.title} status="Passed" points={0} explanation="This detail was present in the offer. Its presence does not verify the offer or the employer." snippet={f.snippet} source={f.source ?? "Offer text analysis"} index={record.greenFlags.indexOf(f)} />
              ))
            )}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium">Red flags</h2>
          <ul className="mt-3 space-y-2">
            {record.redFlags.length === 0 ? (
              <li><FindingRow title="Risk signals" status="Not determined" points={null} explanation="No high-risk signal matched. This check cannot confirm the offer is safe." source="Offer letter analysis" /></li>
            ) : (
              record.redFlags.map((f) => (
              <FindingRow key={`${f.ruleId}-${f.snippet}`} title={f.title} status="Flagged" points={f.severity === "high" ? 35 : f.severity === "medium" ? 20 : 5} explanation="This signal needs review before accepting or paying." snippet={f.snippet} source={f.source ?? "Offer text analysis"} index={record.redFlags.indexOf(f)} />
              ))
            )}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium">Unresolved</h2>
          <ul className="mt-3 space-y-2">
            {record.unresolved.map((u) => (
              <li key={u}><FindingRow title="Unresolved detail" status="Not determined" points={null} explanation={u} source="Offer letter analysis" /></li>
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
              title: record.extracted.jobTitle || "Checked offer",
              employer: record.extracted.employer || "Unknown employer",
              notes: record.emailDraft.subject,
              verificationResult: `${record.verdict} (${record.riskScore}/100)`,
              source: "post-offer check",
              autosave: true,
            })}
            variant="outline"
          >
            Save to application tracker
          </Button>
          <Button href="/check?direction=job_offer" variant="solid">
            Check another advert
          </Button>
        </div>
      </BrutalCard>
    </div>
  );
}
