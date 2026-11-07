"use client";

import { useEffect, useState } from "react";
import { FindingRow } from "@/components/check/FindingRow";
import { RiskScoreBanner } from "@/components/check/RiskScoreBanner";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { trackerPrefillHref } from "@/lib/tracker/query";
import type { OfferAnalysisRecord } from "@/lib/types";
import { displayVerdict } from "@/lib/verdict";

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
      <div className="kc-page space-y-4" aria-busy="true" aria-label="Loading offer analysis">
        <div className="h-44 animate-pulse rounded-3xl bg-kc-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-kc-muted" />
        <p className="sr-only" role="status">Loading offer findings…</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="kc-page" role="alert">
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
    <div className="kc-page">
      <div className="mb-5"><SectionLabel>Offer report</SectionLabel></div>
      <RiskScoreBanner riskBand={record.riskBand} riskScore={record.riskScore} direction="offer_letter" />
      <BrutalCard className="mt-6" tone="white">
        <p className="text-sm font-medium text-kc-ink/80">{displayVerdict(record.verdict)}</p>

        <section className="mt-6">
          <h2 className="text-lg font-semibold">Review these first</h2>
          <div className="mt-3 space-y-2.5">
            {record.redFlags.length === 0 ? (
              <FindingRow title="Risk signals" status="Not determined" points={null} explanation="No high-risk signal matched. This check cannot confirm the offer is safe." source="Offer letter analysis" />
            ) : (
              record.redFlags.map((f, index) => (
                <FindingRow key={`${f.ruleId}-${f.snippet}`} title={f.title} status="Flagged" points={f.severity === "high" ? 35 : f.severity === "medium" ? 20 : 5} explanation="This signal needs review before accepting or paying." snippet={f.snippet} source={f.source ?? "Offer text analysis"} index={index} />
              ))
            )}
          </div>
        </section>

        {record.unresolved.length > 0 ? (
          <details className="mt-6 rounded-2xl border border-kc-ink/10 bg-kc-muted/40 p-3" open={record.redFlags.length === 0}>
            <summary className="cursor-pointer text-sm font-semibold">Unresolved · {record.unresolved.length}</summary>
            <div className="mt-3 space-y-2.5">
              {record.unresolved.map((u) => (
                <FindingRow key={u} title="Unresolved detail" status="Not determined" points={null} explanation={u} source="Offer letter analysis" />
              ))}
            </div>
          </details>
        ) : null}

        <details className="mt-4 rounded-2xl border border-kc-ink/10 bg-kc-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Supporting details · {record.greenFlags.length}</summary>
          <div className="mt-3 space-y-2.5">
            {record.greenFlags.length === 0 ? (
              <FindingRow title="Supporting details" status="Not determined" points={null} explanation="No supporting details were extracted from this offer." source="Offer letter analysis" />
            ) : (
              record.greenFlags.map((f, index) => (
                <FindingRow key={f.ruleId} title={f.title} status="Passed" points={0} explanation="This detail was present in the offer. Its presence does not verify the offer or the employer." snippet={f.snippet} source={f.source ?? "Offer text analysis"} index={index} />
              ))
            )}
          </div>
        </details>

        <section className="mt-6">
          <h2 className="text-lg font-semibold">Questions to ask</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-kc-ink/80">
            {record.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-kc-ink/10 bg-kc-muted/50 p-4">
          <h2 className="text-lg font-semibold">Clarification email draft</h2>
          <p className="mt-2 text-sm font-medium">{record.emailDraft.subject}</p>
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-kc-ink/80">
            {record.emailDraft.body}
          </pre>
          <a
            href={mailto}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-kc-ink px-5 py-2.5 text-sm font-semibold text-kc-on-ink"
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
