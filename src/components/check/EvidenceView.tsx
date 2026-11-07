"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { FlagCountPill } from "@/components/ui/FlagCountPill";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { trackerPrefillHref } from "@/lib/tracker/query";
import type { CheckRecord } from "@/lib/types";
import { displayVerdict } from "@/lib/verdict";

const FLAG_REASONS = [
  "Asked for interview / application fee",
  "Lookalike or fake company domain",
  "Free email while claiming a big employer",
  "Pressure to pay or share documents urgently",
  "Other (write below)",
];

export function EvidenceView({ checkId }: { checkId: string }) {
  const router = useRouter();
  const [check, setCheck] = useState<CheckRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flagCount, setFlagCount] = useState(0);
  const [topReasons, setTopReasons] = useState<string[]>([]);
  const [flagged, setFlagged] = useState(false);
  const [reasonChoice, setReasonChoice] = useState(FLAG_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [phone, setPhone] = useState("");
  const [smsStatus, setSmsStatus] = useState<"idle" | "sent" | "failed" | "stub">(
    "idle",
  );
  const [savedTracker, setSavedTracker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/checks/${checkId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Not found");
        if (!cancelled) {
          setCheck(data);
          const maxFlags = Math.max(
            0,
            ...(data.subjects ?? []).map((s: { flagCount: number }) => s.flagCount),
          );
          setFlagCount(maxFlags);
          const reasons = (data.subjects ?? []).flatMap(
            (s: { topReasons?: string[] }) => s.topReasons ?? [],
          );
          setTopReasons([...new Set(reasons)].slice(0, 5) as string[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkId]);

  const mailto = useMemo(() => {
    if (!check) return "#";
    const subject = encodeURIComponent(
      `Takedown alert: suspected impersonation (${check.id})`,
    );
    const body = encodeURIComponent(
      `We believe your brand is being impersonated.\n\nCheck: ${check.id}\nVerdict: ${check.verdict}\nRisk: ${check.riskScore}/100 (${check.riskBand})\nFlag count: ${flagCount}\nReasons: ${topReasons.join("; ")}\n\nEvidence:\n${check.evidence
        .map((e) => `- ${e.title}: ${e.snippet}`)
        .join("\n")}`,
    );
    return `mailto:security@example.com?subject=${subject}&body=${body}`;
  }, [check, flagCount, topReasons]);

  async function onFlag() {
    if (!check || flagged) return;
    const reason =
      reasonChoice === "Other (write below)"
        ? customReason.trim()
        : reasonChoice;
    if (reason.length < 3) return;

    const primary = check.subjects[0];
    const res = await fetch("/api/subjects/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkId: check.id,
        kind: primary?.kind,
        key: primary?.key,
        reason,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setFlagCount(data.flagCount);
      setTopReasons(data.topReasons ?? [reason]);
      setFlagged(true);
    }
  }

  async function onSms() {
    if (!check || !phone.trim()) return;
    const res = await fetch(`/api/checks/${check.id}/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim() }),
    });
    const data = await res.json();
    if (data.ok) setSmsStatus(data.stub ? "stub" : "sent");
    else setSmsStatus("failed");
  }

  function saveToTracker() {
    if (!check) return;
    const extracted = check.extracted as {
      claimedOrg?: string | null;
      jobTitle?: string | null;
      employer?: string | null;
    };
    const title = extracted.jobTitle || "Checked opportunity";
    const employer =
      extracted.claimedOrg || extracted.employer || "Unknown employer";
    setSavedTracker(true);
    router.push(
      trackerPrefillHref({
        title,
        employer,
        notes: check.recommendedAction,
        checkId: check.id,
        verificationResult: `${check.verdict} (${check.riskScore}/100)`,
        source: "pre-application check",
        autosave: true,
      }),
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 text-lg">Analyzing results…</div>
    );
  }

  if (error || !check) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-lg">{error ?? "Check not found"}</p>
        <Button href="/check" className="mt-6" variant="outline">
          Run another check
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <SectionLabel>Evidence trail</SectionLabel>
        <FlagCountPill count={flagCount} />
      </div>

      <BrutalCard tone="white" className="mt-8">
        <p className="text-sm uppercase tracking-wide text-kc-gray">
          Check {check.id} ·{" "}
          {check.direction === "applicant" ? "Applicant" : "Job offer"}
        </p>
        <h1 className="mt-2 text-4xl font-medium">{displayVerdict(check.verdict)}</h1>
        <p className="mt-3 text-kc-ink/75">
          Risk score {check.riskScore}/100 · {check.riskBand.replaceAll("_", " ")} ·{" "}
          {check.evidence.length} evidence item
          {check.evidence.length === 1 ? "" : "s"}
        </p>
        <p className="mt-4 rounded-2xl border-2 border-kc-ink bg-kc-lime/40 px-4 py-3 text-sm text-[#191a23]">
          <strong>Next step:</strong> {check.recommendedAction}
        </p>

        {check.confirmYourself?.length ? (
          <div className="mt-6">
            <p className="text-sm font-medium">What to confirm yourself</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-kc-ink/80">
              {check.confirmYourself.slice(0, 3).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <details className="mt-8 rounded-2xl border-2 border-kc-ink bg-kc-muted open:bg-kc-white">
          <summary className="cursor-pointer list-none px-4 py-4 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-3">
              <span>
                More info: why this{" "}
                {check.verdict === "SCAM" || check.verdict === "HIGH_RISK"
                  ? "looks risky"
                  : check.verdict === "NO_RED_FLAGS"
                    ? "has no red flags"
                    : "verdict"}
              </span>
              <span className="rounded-full border-2 border-kc-ink bg-kc-lime px-3 py-0.5 text-xs font-medium uppercase text-[#191a23]">
                Optional
              </span>
            </span>
            <span className="mt-1 block text-sm font-normal text-kc-ink/70">
              Open for flagged checks, what passed, evidence snippets, and gaps.
            </span>
          </summary>

          <div className="space-y-6 border-t-2 border-kc-ink px-4 py-5">
            {(() => {
              const findings = check.findings ?? [];
              const flagged = findings.filter((f) => f.outcome === "flagged");
              const passed = findings.filter((f) => f.outcome === "passed");
              const unknown = findings.filter((f) => f.outcome === "unknown");
              return (
                <>
                  {flagged.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium">Flagged (why it looks like a scam / risk)</p>
                      <ul className="mt-2 space-y-2">
                        {flagged.map((f) => (
                          <li
                            key={`${f.checkKey}-${f.title}`}
                            className="rounded-xl border-2 border-kc-ink bg-kc-muted px-3 py-3 text-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-medium">{f.title}</p>
                              {f.points > 0 ? (
                                <span className="rounded-md bg-kc-lime px-2 py-0.5 text-xs font-medium text-[#191a23]">
                                  +{f.points}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-kc-ink/80">{f.explanation}</p>
                            {f.evidence ? (
                              <p className="mt-2 text-xs text-kc-gray">
                                From the ad: “{f.evidence}”
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-kc-ink/80">
                      No stacked fraud signals fired. That is not a stamp that the job is
                      genuine — confirm on the official careers page.
                    </p>
                  )}

                  {passed.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium">Passed checks</p>
                      <ul className="mt-2 space-y-2">
                        {passed.map((f) => (
                          <li
                            key={`${f.checkKey}-pass`}
                            className="rounded-xl border-2 border-kc-ink/40 bg-kc-white px-3 py-2 text-sm text-kc-ink/80"
                          >
                            <span className="font-medium text-kc-ink">{f.title}</span>
                            {" — "}
                            {f.explanation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {unknown.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium">Could not fully check</p>
                      <ul className="mt-2 space-y-2">
                        {unknown.map((f) => (
                          <li
                            key={`${f.checkKey}-unk`}
                            className="rounded-xl border-2 border-dashed border-kc-ink/50 bg-kc-muted px-3 py-2 text-sm"
                          >
                            <span className="font-medium">{f.title}</span>
                            {" — "}
                            {f.explanation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              );
            })()}

            {check.gaps?.length ? (
              <div>
                <p className="text-sm font-medium">Gaps</p>
                <ul className="mt-2 space-y-2">
                  {check.gaps.map((g) => (
                    <li
                      key={g}
                      className="rounded-xl border-2 border-kc-ink bg-kc-muted px-3 py-2 text-sm"
                    >
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {topReasons.length > 0 ? (
              <div>
                <p className="text-sm font-medium">Community flag reasons</p>
                <ul className="mt-2 space-y-2">
                  {topReasons.map((r) => (
                    <li
                      key={r}
                      className="rounded-xl border-2 border-kc-ink bg-kc-muted px-3 py-2 text-sm"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <p className="text-sm font-medium">Evidence trail</p>
              <ul className="mt-2 space-y-3">
                {check.evidence.length === 0 ? (
                  <li className="rounded-xl border-2 border-kc-ink bg-kc-muted px-3 py-3 text-sm">
                    No red-flag evidence items on current checks.
                  </li>
                ) : (
                  check.evidence.map((item) => (
                    <li
                      key={`${item.ruleId}-${item.snippet}`}
                      className="rounded-xl border-2 border-kc-ink bg-kc-muted px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="mt-1 text-sm text-kc-ink/75">{item.snippet}</p>
                          <p className="mt-2 text-xs text-kc-gray">
                            Source: {item.sourceType ?? "heuristic"}
                            {item.retrievedAt
                              ? ` · ${new Date(item.retrievedAt).toLocaleString()}`
                              : ""}
                          </p>
                        </div>
                        <span className="rounded-md bg-kc-lime px-2 py-0.5 text-xs font-medium uppercase text-[#191a23]">
                          {item.severity}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </details>

        <div className="mt-8 space-y-3 rounded-2xl border-2 border-kc-ink bg-kc-muted p-4">
          <p className="font-medium">Flag as scam (reason required)</p>
          <select
            value={reasonChoice}
            onChange={(e) => setReasonChoice(e.target.value)}
            className="w-full rounded-xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-kc-ink"
            disabled={flagged}
          >
            {FLAG_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {reasonChoice === "Other (write below)" ? (
            <input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Describe why this is a scam"
              className="w-full rounded-xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-kc-ink"
              disabled={flagged}
            />
          ) : null}
          <Button variant="solid" onClick={onFlag} disabled={flagged}>
            {flagged ? "Flagged with reason" : "Submit flag"}
          </Button>
        </div>

        <div className="mt-8 space-y-3">
          <label className="block text-sm font-medium" htmlFor="sms-phone">
            Send verdict SMS
          </label>
          <div className="flex flex-wrap gap-3">
            <input
              id="sms-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX"
              className="min-w-[200px] flex-1 rounded-xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-kc-ink"
            />
            <Button variant="lime" onClick={onSms}>
              {smsStatus === "sent"
                ? "Sent"
                : smsStatus === "stub"
                  ? "Queued (stub)"
                  : smsStatus === "failed"
                    ? "Failed, retry"
                    : "Send SMS"}
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={mailto}
            className="inline-flex items-center justify-center rounded-xl border-2 border-kc-ink bg-transparent px-6 py-3.5 text-base font-medium text-kc-ink hover:bg-kc-muted"
          >
            Generate takedown alert
          </a>
          <Button variant="outline" onClick={saveToTracker} disabled={savedTracker}>
            {savedTracker ? "Saved to tracker" : "Save to application tracker"}
          </Button>
          <Button href={`/skills?checkId=${check.id}`} variant="lime">
            Skill match this role
          </Button>
          <Button href="/registry" variant="outline">
            Open registry
          </Button>
        </div>
      </BrutalCard>
    </div>
  );
}
