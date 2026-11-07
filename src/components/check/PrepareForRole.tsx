"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { CheckRecord } from "@/lib/types";

type FitPayload = {
  fit: {
    score: number;
    label: string;
    matchBullets: string[];
    gapBullets: string[];
    roleTitle: string;
  };
  fileName: string;
  downloadUrl: string;
  officialApplyUrl: string | null;
};

export function PrepareForRole({ check }: { check: CheckRecord }) {
  const blocked = check.verdict === "SCAM" || check.verdict === "HIGH_RISK";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pack, setPack] = useState<FitPayload | null>(null);

  if (blocked) {
    return (
      <section className="mt-5 rounded-[1.5rem] border border-red-200 bg-red-50/80 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-red-900">Prepare to apply</h2>
        <p className="mt-2 text-sm leading-6 text-red-900/80">
          This job looks too risky. We will not build a CV or suggest applying.
        </p>
      </section>
    );
  }

  async function onPrepare() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/checks/${check.id}/prepare`, { method: "POST" });
      const data = await res.json();
      if (res.status === 401) {
        setError("Sign in with your phone on the profile page first.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not prepare your CV.");
        return;
      }
      setPack(data as FitPayload);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-[1.5rem] bg-kc-white p-4 shadow-[0_12px_32px_rgba(18,20,26,0.06)] sm:p-5">
      <h2 className="text-lg font-semibold">Prepare for this role</h2>
      <p className="mt-2 text-sm leading-6 text-kc-ink/75">
        Get a match score and a tailored ATS CV. We never submit the application for you.
      </p>

      {!pack ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={onPrepare} disabled={busy}>
            {busy ? "Preparing…" : "Get match score & CV"}
          </Button>
          <Button href="/profile" variant="outline">
            Set up profile
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-base font-semibold">
            {pack.fit.score}/100 — {pack.fit.label}
            <span className="ml-2 text-sm font-normal text-kc-ink/60">
              for “{pack.fit.roleTitle}”
            </span>
          </p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-kc-gray">
              Why you match
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-kc-ink/80">
              {pack.fit.matchBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-kc-gray">
              Gaps to watch
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-kc-ink/80">
              {pack.fit.gapBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button href={pack.downloadUrl} variant="lime">
              Download CV for this role
            </Button>
            {pack.officialApplyUrl ? (
              <Button href={pack.officialApplyUrl} variant="outline">
                Open official apply page
              </Button>
            ) : (
              <p className="self-center text-sm text-kc-ink/60">
                No verified official apply link — use the employer’s real careers site.
              </p>
            )}
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}{" "}
          {error.includes("profile") || error.includes("Sign in") ? (
            <a href="/profile" className="underline">
              Open profile
            </a>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
