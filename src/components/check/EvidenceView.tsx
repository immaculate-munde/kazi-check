"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { FlagCountPill } from "@/components/ui/FlagCountPill";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { CheckRecord } from "@/lib/types";

export function EvidenceView({ checkId }: { checkId: string }) {
  const [check, setCheck] = useState<CheckRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flagCount, setFlagCount] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsStatus, setSmsStatus] = useState<"idle" | "sent" | "failed" | "stub">(
    "idle",
  );

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
      `We believe your brand is being impersonated.\n\nCheck: ${check.id}\nVerdict: ${check.verdict}\nFlag count: ${flagCount}\n\nEvidence:\n${check.evidence
        .map((e) => `- ${e.title}: ${e.snippet}`)
        .join("\n")}`,
    );
    return `mailto:security@example.com?subject=${subject}&body=${body}`;
  }, [check, flagCount]);

  async function onFlag() {
    if (!check || flagged) return;
    const primary = check.subjects[0];
    const res = await fetch("/api/subjects/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkId: check.id,
        kind: primary?.kind,
        key: primary?.key,
        reason: `Flagged after ${check.verdict} verdict`,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setFlagCount(data.flagCount);
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
        <h1 className="mt-2 text-4xl font-medium">{check.verdict}</h1>
        <p className="mt-3 text-kc-ink/75">
          Score {(check.score * 100).toFixed(0)}% risk ·{" "}
          {check.evidence.length} evidence item
          {check.evidence.length === 1 ? "" : "s"}
        </p>

        <ul className="mt-8 space-y-3">
          {check.evidence.length === 0 ? (
            <li className="rounded-2xl border-2 border-kc-ink bg-kc-muted px-4 py-4">
              No rule hits — looks comparatively clean on current heuristics.
            </li>
          ) : (
            check.evidence.map((item) => (
              <li
                key={`${item.ruleId}-${item.snippet}`}
                className="rounded-2xl border-2 border-kc-ink bg-kc-muted px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-kc-ink/75">{item.snippet}</p>
                  </div>
                  <span className="rounded-md bg-kc-lime px-2 py-0.5 text-xs font-medium uppercase">
                    {item.severity}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>

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
              className="min-w-[200px] flex-1 rounded-xl border-2 border-kc-ink px-4 py-3"
            />
            <Button variant="lime" onClick={onSms}>
              {smsStatus === "sent"
                ? "Sent"
                : smsStatus === "stub"
                  ? "Queued (stub)"
                  : smsStatus === "failed"
                    ? "Failed — retry"
                    : "Send SMS"}
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="solid" onClick={onFlag} disabled={flagged}>
            {flagged ? "Flagged" : "Flag as scam"}
          </Button>
          <a
            href={mailto}
            className="inline-flex items-center justify-center rounded-xl border-2 border-kc-ink bg-transparent px-6 py-3.5 text-base font-medium hover:bg-kc-muted"
          >
            Generate takedown alert
          </a>
          <Button href="/registry" variant="outline">
            Open registry
          </Button>
        </div>
      </BrutalCard>
    </div>
  );
}
