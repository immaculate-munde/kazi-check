"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckFindings } from "@/components/check/CheckFindings";
import { FindingRow, type FindingStatus } from "@/components/check/FindingRow";
import { OfficialOrgSidebar } from "@/components/check/OfficialOrgSidebar";
import { RiskScoreBanner, riskSummary } from "@/components/check/RiskScoreBanner";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { FlagCountPill } from "@/components/ui/FlagCountPill";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { countFindings, queueLineForCheck } from "@/lib/check/queue-line";
import { trackerPrefillHref } from "@/lib/tracker/query";
import type { CheckRecord, EvidenceItem } from "@/lib/types";

const FLAG_REASONS = [
  "Asked for interview / application fee",
  "Lookalike or fake company domain",
  "Free email while claiming a big employer",
  "Pressure to pay or share documents urgently",
  "Other (write below)",
];

type Finding = {
  id: string;
  title: string;
  status: FindingStatus;
  points: number | null;
  explanation: string;
  snippet?: string;
  source: string;
};

function scoreImpact(item: EvidenceItem) {
  if (item.ruleId === "whitelist_match") return -30;
  if (item.severity === "high") return 35;
  if (item.severity === "medium") return 20;
  return 5;
}

function sourceLabel(item: EvidenceItem) {
  if (item.source) return item.source;
  switch (item.sourceType) {
    case "content":
      return "Submitted message";
    case "registry":
      return "Kazi Check registry";
    case "whitelist":
      return "Official domain directory";
    case "community":
      return "Kazi Check community reports";
    default:
      return "Kazi Check rules engine";
  }
}

function buildFindings(check: CheckRecord, flagCount: number): Finding[] {
  const findings: Finding[] = check.evidence.map((item) => {
    const isWhitelist = item.ruleId === "whitelist_match";
    const isUnknown = item.ruleId === "whois_age";
    const status: FindingStatus = isWhitelist
      ? "Passed"
      : isUnknown
        ? "Not determined"
        : "Flagged";
    return {
      id: `${item.ruleId}-${item.snippet}`,
      title: item.title,
      status,
      points: isUnknown ? null : scoreImpact(item),
      explanation: isWhitelist
        ? "The domain matched the configured official-domain list. Verify the vacancy on the careers page as well."
        : isUnknown
          ? "This check is not connected yet, so it did not affect the result."
          : item.ruleId === "pay_to_apply"
            ? "A request for payment appeared in the submitted content. Do not send money to secure a job."
            : item.ruleId === "impersonation"
              ? "This domain resembles an employer but does not match its configured official domain."
              : item.title,
      snippet: item.snippet,
      source: sourceLabel(item),
    };
  });

  const evidenceIds = new Set(check.evidence.map((item) => item.ruleId));
  if (!evidenceIds.has("pay_to_apply")) {
    const hasEnoughText = check.rawText.trim().length >= 30;
    const hasPaymentLanguage = /\b(?:fee|fees|payment|pay|mpesa|m-pesa|deposit|till)\b/i.test(check.rawText);
    findings.push({
      id: "pay-to-apply-check",
      title: "Pay-to-apply request",
      status: hasEnoughText && !hasPaymentLanguage ? "Passed" : "Not determined",
      points: 0,
      explanation: hasPaymentLanguage
        ? "Payment wording appears, but the current pay-to-apply rule did not match it. Review the terms manually."
        : hasEnoughText
        ? "No fee wording matched in the text provided. This limited check cannot confirm an offer is legitimate."
        : "Add the full message to check for payment requests.",
      source: "Kazi Check text rules",
    });
  }

  const hasDomainEvidence =
    evidenceIds.has("whitelist_match") || evidenceIds.has("impersonation");
  if (!hasDomainEvidence) {
    const domain = "domain" in check.extracted ? check.extracted.domain : null;
    const hasDomain = Boolean(domain);
    findings.push({
      id: "official-domain-check",
      title: "Employer domain",
      status: "Not determined",
      points: 0,
      explanation: hasDomain
        ? "This domain is not in the current official-domain directory. Verify it on the employer’s own website."
        : "No employer domain could be checked from the supplied content.",
      snippet: domain ?? undefined,
      source: "Official domain directory",
    });
  }

  if (!evidenceIds.has("community_flags")) {
    findings.push({
      id: "community-check",
      title: "Community reports",
      status: "Not determined",
      points: 0,
      explanation:
        flagCount > 0
          ? `${flagCount} related report${flagCount === 1 ? " is" : "s are"} visible. There is not enough information to include them in the automated score.`
          : "No matching community reports were found. A clear registry does not prove an opportunity is safe.",
      source: "Kazi Check community registry",
    });
  }

  return findings;
}

export function EvidenceView({ checkId }: { checkId: string }) {
  const router = useRouter();
  const [check, setCheck] = useState<CheckRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [topReasons, setTopReasons] = useState<string[]>([]);
  const [flagged, setFlagged] = useState(false);
  const [reasonChoice, setReasonChoice] = useState(FLAG_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [claimedOrg, setClaimedOrg] = useState("");
  const [paymentTarget, setPaymentTarget] = useState("");
  const [amountKes, setAmountKes] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsStatus, setSmsStatus] = useState<"idle" | "sent" | "failed" | "stub">("idle");
  const [savedTracker, setSavedTracker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/checks/${checkId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Check not found");
        if (!cancelled) {
          const record = data as CheckRecord;
          setCheck(record);
          const maxFlags = Math.max(
            0,
            ...(record.subjects ?? []).map((subject) => subject.flagCount),
          );
          setFlagCount(maxFlags);
          const reasons = (record.subjects ?? []).flatMap(
            (subject) => subject.topReasons ?? [],
          );
          setTopReasons([...new Set(reasons)].slice(0, 5));
          const extractedOrg =
            "claimedOrg" in record.extracted
              ? record.extracted.claimedOrg
              : "claimedEmployer" in record.extracted
                ? record.extracted.claimedEmployer
                : "";
          setClaimedOrg(extractedOrg ?? "");
          setExcerpt(record.rawText.slice(0, 240));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load this check.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkId, retryCount]);

  const fallbackFindings = useMemo(
    () => (check ? buildFindings(check, flagCount) : []),
    [check, flagCount],
  );
  const engineCounts = check ? countFindings(check.findings) : { flagged: 0, unknown: 0 };
  const flaggedFindings =
    check?.findings?.length ? engineCounts.flagged : fallbackFindings.filter((item) => item.status === "Flagged").length;
  const unknownFindings =
    check?.findings?.length ? engineCounts.unknown : fallbackFindings.filter((item) => item.status === "Not determined").length;

  async function onFlag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!check || flagged || !reviewed) return;
    const selectedReason =
      reasonChoice === "Other (write below)" ? customReason.trim() : reasonChoice;
    if (selectedReason.length < 3) {
      setReportError("Add a short reason so others understand what happened.");
      return;
    }

    const reportReason = [
      selectedReason,
      claimedOrg.trim() && `Claimed organization: ${claimedOrg.trim()}`,
      paymentTarget.trim() && `Till / phone: ${paymentTarget.trim()}`,
      amountKes && `Amount: KSh ${amountKes}`,
      excerpt.trim() && `Excerpt: ${excerpt.trim()}`,
    ]
      .filter(Boolean)
      .join(" | ")
      .slice(0, 500);

    setSubmittingReport(true);
    setReportError(null);
    setReportMessage(null);
    try {
      const primary = check.subjects[0];
      const res = await fetch("/api/subjects/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkId: check.id,
          kind: primary?.kind,
          key: primary?.key,
          reason: reportReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "We could not save your report.");
      setFlagCount(data.flagCount);
      setTopReasons(data.topReasons ?? [reportReason]);
      setFlagged(true);
      setReportMessage(
        data.alreadyFlagged
          ? "This browser has already reported this item. Your report is still visible in the registry."
          : "Report added to the community registry.",
      );
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "We could not save your report. Try again.");
    } finally {
      setSubmittingReport(false);
    }
  }

  async function onSms() {
    if (!check || !phone.trim()) return;
    try {
      const res = await fetch(`/api/checks/${check.id}/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.ok) setSmsStatus(data.stub ? "stub" : "sent");
      else setSmsStatus("failed");
    } catch {
      setSmsStatus("failed");
    }
  }

  function saveToTracker() {
    if (!check) return;
    const extracted = check.extracted as {
      claimedOrg?: string | null;
      claimedEmployer?: string | null;
      jobTitle?: string | null;
      employer?: string | null;
    };
    const title = extracted.jobTitle || "Checked opportunity";
    const employer =
      extracted.claimedOrg ||
      extracted.claimedEmployer ||
      extracted.employer ||
      "Unknown employer";
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
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8" aria-busy="true" aria-label="Loading check results">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-5">
            <div className="h-48 animate-pulse rounded-3xl bg-kc-muted" />
            <div className="h-20 animate-pulse rounded-2xl bg-kc-muted" />
            <div className="h-28 animate-pulse rounded-2xl bg-kc-muted" />
          </div>
          <div className="h-64 animate-pulse rounded-3xl bg-kc-muted" />
        </div>
        <p className="sr-only" role="status">Loading evidence and risk signals…</p>
      </div>
    );
  }

  if (error || !check) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8" role="alert">
        <BrutalCard tone="white" className="border-red-200 shadow-none">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-800">Could not open this check</p>
          <h1 className="mt-2 text-2xl font-semibold">Your result is still safe to retry.</h1>
          <p className="mt-3 leading-7 text-kc-ink/75">{error ?? "Check not found"}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</Button>
            <Button href="/check" variant="outline">Run another check</Button>
          </div>
        </BrutalCard>
      </div>
    );
  }

  const summary = riskSummary(check.riskBand, check.direction);
  const queueStatus = flaggedFindings + unknownFindings + (check.findings?.length ?? fallbackFindings.length) > 0
    ? summary.queue
    : "NEEDS INPUT";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 md:px-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
      <main className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <SectionLabel>Opportunity check</SectionLabel>
          <FlagCountPill count={flagCount} />
          <span className="text-xs text-kc-gray">{check.id}</span>
        </div>

        <RiskScoreBanner
          riskBand={check.riskBand}
          riskScore={check.riskScore}
          direction={check.direction}
          queueLine={queueLineForCheck(check, queueStatus)}
        />

        <section className="mt-7" aria-labelledby="recommended-action">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kc-gray">Check {check.id}</p>
              <h2 id="recommended-action" className="mt-1 text-xl font-semibold">What to do next</h2>
            </div>
            <span className="text-sm text-kc-gray">{new Date(check.createdAt).toLocaleString()}</span>
          </div>
          <div className="mt-3 rounded-2xl border border-kc-ink/10 bg-kc-white p-4 shadow-[0_8px_24px_rgba(25,26,35,0.05)] sm:p-5">
            <p className="leading-7 text-kc-ink/85">{check.recommendedAction}</p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="findings-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="findings-title" className="text-xl font-semibold">Findings</h2>
              <p className="mt-1 text-sm text-kc-gray">Each row shows what matched and its impact on this score.</p>
            </div>
            <p className="text-xs text-kc-gray">Score impact is capped at 100.</p>
          </div>
          {check.findings?.length ? (
            <CheckFindings findings={check.findings} />
          ) : (
            <div className="space-y-3">
              {fallbackFindings.map((item, index) => (
                <FindingRow
                  key={item.id}
                  title={item.title}
                  status={item.status}
                  points={item.points}
                  explanation={item.explanation}
                  snippet={item.snippet}
                  source={item.source}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>

        {topReasons.length > 0 ? (
          <section className="mt-8 rounded-2xl border border-kc-ink/10 bg-kc-muted/60 p-4 sm:p-5" aria-labelledby="community-title">
            <h2 id="community-title" className="font-semibold">Community context</h2>
            <p className="mt-1 text-sm leading-6 text-kc-ink/70">These are reports from other people, shown as context rather than proof.</p>
            <ul className="mt-3 space-y-2">
              {topReasons.map((reason) => (
                <li key={reason} className="rounded-xl bg-kc-white px-3 py-2 text-sm">{reason}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8 rounded-2xl border border-kc-ink/10 bg-kc-white p-4 sm:p-5" aria-labelledby="report-title">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kc-gray">Help others check</p>
            <h2 id="report-title" className="mt-1 text-xl font-semibold">Report what happened</h2>
            <p className="mt-2 text-sm leading-6 text-kc-ink/70">Add details you personally reviewed. Your report is added to the community registry after submission.</p>
          </div>
          <form className="space-y-4" onSubmit={onFlag}>
            <div>
              <label htmlFor="flag-reason" className="mb-1.5 block text-sm font-medium">Main reason</label>
              <select id="flag-reason" value={reasonChoice} onChange={(e) => setReasonChoice(e.target.value)} className="min-h-11 w-full rounded-xl border border-kc-ink/15 bg-kc-white px-3 py-2.5 text-sm text-kc-ink focus:outline-none focus:ring-2 focus:ring-kc-lime" disabled={flagged}>
                {FLAG_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
              </select>
            </div>
            {reasonChoice === "Other (write below)" ? (
              <div>
                <label htmlFor="custom-reason" className="mb-1.5 block text-sm font-medium">What happened?</label>
                <input id="custom-reason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} maxLength={160} className="min-h-11 w-full rounded-xl border border-kc-ink/15 bg-kc-white px-3 py-2.5 text-sm text-kc-ink focus:outline-none focus:ring-2 focus:ring-kc-lime" disabled={flagged} />
              </div>
            ) : null}
            <div>
              <label htmlFor="claimed-org" className="mb-1.5 block text-sm font-medium">Claimed organization <span className="font-normal text-kc-gray">(optional)</span></label>
              <input id="claimed-org" value={claimedOrg} onChange={(e) => setClaimedOrg(e.target.value)} maxLength={100} className="min-h-11 w-full rounded-xl border border-kc-ink/15 bg-kc-white px-3 py-2.5 text-sm text-kc-ink focus:outline-none focus:ring-2 focus:ring-kc-lime" disabled={flagged} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="payment-target" className="mb-1.5 block text-sm font-medium">Till / phone <span className="font-normal text-kc-gray">(optional)</span></label>
                <input id="payment-target" type="text" inputMode="tel" value={paymentTarget} onChange={(e) => setPaymentTarget(e.target.value)} maxLength={80} className="min-h-11 w-full rounded-xl border border-kc-ink/15 bg-kc-white px-3 py-2.5 text-sm text-kc-ink focus:outline-none focus:ring-2 focus:ring-kc-lime" disabled={flagged} />
              </div>
              <div>
                <label htmlFor="amount-kes" className="mb-1.5 block text-sm font-medium">Amount in KSh <span className="font-normal text-kc-gray">(optional)</span></label>
                <div className="flex min-h-11 items-center overflow-hidden rounded-xl border border-kc-ink/15 bg-kc-white focus-within:ring-2 focus-within:ring-kc-lime">
                  <span className="border-r border-kc-ink/10 px-3 py-2.5 text-sm text-kc-gray">KSh</span>
                  <input id="amount-kes" type="number" min="0" step="1" inputMode="numeric" value={amountKes} onChange={(e) => setAmountKes(e.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-kc-ink outline-none" disabled={flagged} />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="report-excerpt" className="mb-1.5 block text-sm font-medium">Message excerpt <span className="font-normal text-kc-gray">(optional)</span></label>
              <textarea id="report-excerpt" rows={3} maxLength={240} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full rounded-xl border border-kc-ink/15 bg-kc-white px-3 py-2.5 text-sm leading-6 text-kc-ink focus:outline-none focus:ring-2 focus:ring-kc-lime" disabled={flagged} />
              <p className="mt-1 text-right text-xs text-kc-gray">{excerpt.length}/240</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-kc-muted/70 p-3 text-sm leading-6 text-kc-ink/80">
              <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="mt-1 h-4 w-4 accent-[#191a23]" disabled={flagged} required />
              <span>I reviewed these details and understand this report will be published to the community registry.</span>
            </label>
            {reportError ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900">{reportError}</p> : null}
            {reportMessage ? <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{reportMessage}</p> : null}
            <Button type="submit" variant="solid" disabled={flagged || submittingReport || !reviewed} className="w-full sm:w-auto">
              {submittingReport ? "Adding your report…" : flagged ? "Report submitted" : "Submit community report"}
            </Button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-kc-ink/10 bg-kc-white p-4 sm:p-5" aria-labelledby="sms-title">
          <h2 id="sms-title" className="font-semibold">Send the verdict by SMS</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="sms-phone" className="sr-only">Phone number for SMS</label>
            <input id="sms-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="min-h-11 min-w-0 flex-1 rounded-xl border border-kc-ink/15 bg-kc-white px-3 py-2.5 text-sm text-kc-ink focus:outline-none focus:ring-2 focus:ring-kc-lime" />
            <Button type="button" variant="outline" onClick={onSms} disabled={!phone.trim()}>
              {smsStatus === "sent" ? "Sent" : smsStatus === "stub" ? "Queued (demo)" : smsStatus === "failed" ? "Failed — retry" : "Send SMS"}
            </Button>
          </div>
          {smsStatus !== "idle" ? <p className="mt-2 text-sm text-kc-ink/70" role="status">{smsStatus === "stub" ? "SMS is a demo stub. No message was delivered." : smsStatus === "sent" ? "Verdict sent." : "The SMS could not be sent. Check the number and retry."}</p> : null}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button variant="outline" onClick={saveToTracker} disabled={savedTracker}>
            {savedTracker ? "Saved to tracker" : "Save to application tracker"}
          </Button>
          <Button href={`/skills?checkId=${check.id}`} variant="lime">Skill match this role</Button>
          <Button href="/registry" variant="outline">Open community registry</Button>
        </div>
      </main>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <OfficialOrgSidebar check={check} />

        <section className="rounded-3xl border border-kc-ink/10 bg-kc-muted/60 p-5">
          <h2 className="font-semibold">How to read this result</h2>
          <p className="mt-2 text-sm leading-6 text-kc-ink/70">These are automated risk indicators, not a legal conclusion or a guarantee. Review the evidence and verify with the employer.</p>
          <a href="https://www.dci.go.ke/" target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center font-medium text-kc-ink underline decoration-kc-ink/30 underline-offset-4 hover:decoration-kc-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-ink">Lost money? Report it to DCI ↗</a>
        </section>
      </aside>
    </div>
  );
}
