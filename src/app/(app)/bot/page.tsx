"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckFindings } from "@/components/check/CheckFindings";
import { OfficialOrgSidebar } from "@/components/check/OfficialOrgSidebar";
import { RiskScoreBanner } from "@/components/check/RiskScoreBanner";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { PageIntro } from "@/components/ui/PageIntro";
import type { BotQueueItem, CheckRecord } from "@/lib/types";

type UploadResponse = {
  items: BotQueueItem[];
  table: { ad: string; line: string; verdict: string; gate: string; reason: string }[];
  errors?: { filename: string; reason: string }[];
  truncated?: number;
};

const fieldClass =
  "kc-field text-sm";

function gateClass(gate?: string) {
  if (gate === "BLOCKED") return "bg-red-100 text-red-950";
  if (gate === "ELIGIBLE") return "bg-emerald-100 text-emerald-950";
  return "bg-amber-100 text-amber-950";
}

function adTitle(item: BotQueueItem) {
  const line = item.maskedText.trim().split("\n").find(Boolean) ?? "";
  const short = line.slice(0, 80);
  return item.filename ?? (short || item.id);
}

export default function BotPage() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [items, setItems] = useState<BotQueueItem[]>([]);
  const [errors, setErrors] = useState<UploadResponse["errors"]>([]);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [digest, setDigest] = useState<string | null>(null);
  const [selected, setSelected] = useState<BotQueueItem | null>(null);
  const [selectedCheck, setSelectedCheck] = useState<CheckRecord | null>(null);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [cvText, setCvText] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pickItem = useCallback((item: BotQueueItem) => {
    setSelected(item);
    setTicks({});
    setMatchScore(null);
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/bot/queue");
    const data = await res.json();
    const nextItems = (data.items ?? []) as BotQueueItem[];
    setItems(nextItems);
    setSelected((prev) => {
      if (!nextItems.length) return null;
      if (!prev) return nextItems[0];
      return nextItems.find((item) => item.id === prev.id) ?? nextItems[0];
    });
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    if (!selected?.checkId) {
      setSelectedCheck(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/checks/${selected.checkId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!cancelled && res.ok) setSelectedCheck(data as CheckRecord);
      })
      .catch(() => {
        if (!cancelled) setSelectedCheck(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.checkId]);

  async function onUpload() {
    if (!text.trim() && (!files || files.length === 0)) return;
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      if (text.trim()) form.set("text", text);
      if (phone.trim()) form.set("phone", phone.trim());
      if (files) {
        for (const f of Array.from(files)) form.append("files", f);
      }
      const res = await fetch("/api/bot/upload", { method: "POST", body: form });
      const data = (await res.json()) as UploadResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setItems(data.items);
      setErrors(data.errors);
      if (data.items[0]) pickItem(data.items[0]);
      if (data.truncated) {
        setMessage(`Batch capped at 20 ads. ${data.truncated} extra row(s) skipped.`);
      }
      setText("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDigest(dryRun: boolean) {
    if (!phone.trim()) return;
    const res = await fetch("/api/bot/digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), dryRun }),
    });
    const data = await res.json();
    setDigest(
      data.dryRun ? `Dry run (no SMS sent): ${data.message}` : data.message ?? "Queued",
    );
  }

  async function confirmSelected() {
    if (!selected) return;
    const confirmedGaps = selected.gaps.filter((g) => ticks[g]);
    const res = await fetch("/api/bot/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, confirmedGaps }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Confirm failed");
      return;
    }
    setSelected(data);
    await refresh();
    setMessage("Gaps logged as confirmed.");
  }

  async function draftSelected() {
    if (!selected) return;
    const res = await fetch("/api/bot/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Draft blocked");
      return;
    }
    setSelected(data);
    await refresh();
  }

  async function applySelected() {
    if (!selected) return;
    const res = await fetch("/api/bot/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Apply blocked");
      return;
    }
    setSelected(data);
    await refresh();
    if (data.apply?.applyUrl) {
      window.open(data.apply.applyUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function matchSelected() {
    if (!selected || cvText.trim().length < 20) return;
    const res = await fetch("/api/bot/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, cvText }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Match blocked");
      return;
    }
    setMatchScore(data.compatibilityScore);
  }

  const gate = selected?.gate ?? selected?.status;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
      <PageIntro kicker="Job Bot" title="Check a batch, then act on one ad at a time.">
        Blocked ads stay blocked. Eligible ads open the official careers portal
        with a draft — never WhatsApp, never an auto-submit.
      </PageIntro>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <BrutalCard tone="white">
            <h2 className="text-sm font-semibold">Add ads</h2>
            <label className="mt-3 mb-1.5 block text-xs font-medium text-kc-ink/80" htmlFor="bot-text">
              Paste an ad
            </label>
            <textarea
              id="bot-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Acme Roads Authority hiring 800 staff…"
              className={fieldClass}
            />
            <label className="mb-1.5 mt-4 block text-xs font-medium text-kc-ink/80" htmlFor="bot-files">
              Or upload files (.txt, .csv, .pdf, screenshots)
            </label>
            <input
              id="bot-files"
              type="file"
              multiple
              accept=".txt,.csv,.pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFiles(e.target.files)}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-kc-white file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <p className="mt-2 text-xs leading-5 text-kc-gray">Max 20 ads, 5MB each. Personal details are masked.</p>
            <div className="mt-4">
              <Button type="button" variant="lime" onClick={onUpload} disabled={busy} className="w-full">
                {busy ? "Checking…" : "Check batch"}
              </Button>
            </div>
            {message ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
            {errors && errors.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-kc-ink/80">
                {errors.map((e) => (
                  <li key={e.filename}>
                    {e.filename}: {e.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </BrutalCard>

          <section aria-label="Inbox">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Inbox</h2>
              <span className="text-xs text-kc-gray">{items.length} ad{items.length === 1 ? "" : "s"}</span>
            </div>
            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-kc-ink/15 px-4 py-6 text-sm text-kc-gray">
                Nothing in the queue yet. Paste an ad or upload a file.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => {
                  const active = selected?.id === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => pickItem(item)}
                        className={`w-full rounded-2xl border px-3.5 py-3 text-left transition ${
                          active
                            ? "border-kc-ink bg-kc-white shadow-[0_8px_24px_rgba(25,26,35,0.06)]"
                            : "border-kc-ink/10 bg-kc-muted/40 hover:bg-kc-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${gateClass(item.gate ?? item.status)}`}>
                            {item.gate ?? item.status}
                          </span>
                          <span className="font-mono text-[11px] text-kc-gray">{item.verdict ?? "—"} · {item.riskScore ?? 0}</span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-5 text-kc-ink">{adTitle(item)}</p>
                        <p className="mt-1 text-xs text-kc-gray">
                          {item.flaggedCount ?? 0} flagged · {item.unknownCount ?? 0} unknown
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <details className="rounded-2xl border border-kc-ink/10 bg-kc-muted/40 p-4">
            <summary className="cursor-pointer text-sm font-semibold">SMS digest (optional)</summary>
            <p className="mt-2 text-xs leading-5 text-kc-gray">Send a short batch summary after you have reviewed the queue.</p>
            <div className="mt-3 space-y-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className={fieldClass}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => onDigest(true)}>
                  Dry run
                </Button>
                <Button type="button" variant="lime" onClick={() => onDigest(false)}>
                  Send SMS
                </Button>
              </div>
              {digest ? <p className="text-sm text-kc-ink/80">{digest}</p> : null}
            </div>
          </details>
        </div>

        <div className="min-w-0">
          {selected ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_16rem] xl:items-start">
              <BrutalCard tone="white">
                {selectedCheck ? (
                  <RiskScoreBanner
                    riskBand={selectedCheck.riskBand}
                    riskScore={selectedCheck.riskScore}
                    direction={selectedCheck.direction}
                    chips={[
                      { label: selected.verdict ?? selected.status, emphasize: true },
                      { label: `${selected.flaggedCount ?? 0} flagged` },
                      { label: `${selected.unknownCount ?? 0} unknown` },
                      { label: gate ?? "REVIEW" },
                    ]}
                  />
                ) : (
                  <div className="rounded-3xl border border-kc-ink/10 bg-kc-muted p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-kc-gray">Decision</p>
                    <h2 className="mt-2 text-2xl font-semibold">{gate}</h2>
                    <p className="mt-2 text-sm text-kc-ink/75">{selected.reason ?? "Check still loading."}</p>
                  </div>
                )}

                <section className="mt-5 rounded-2xl border border-kc-ink/10 bg-kc-muted/50 p-4">
                  <h2 className="text-sm font-semibold">What you can do now</h2>
                  {gate === "BLOCKED" ? (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm leading-6 text-kc-ink/80">
                        This ad is blocked. Do not draft or apply. Review the evidence, then report it if it matches a scam.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selected.checkId ? (
                          <Button href={`/checks/${selected.checkId}`} variant="outline">
                            Open evidence
                          </Button>
                        ) : null}
                        <Button href="/registry" variant="solid">
                          Report in registry
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {gate === "NEEDS_CONFIRMATION" ? (
                        <p className="text-sm leading-6 text-kc-ink/80">
                          Confirm the gaps below before applying. We still only open an official portal — never WhatsApp.
                        </p>
                      ) : (
                        <p className="text-sm leading-6 text-kc-ink/80">
                          Eligible to continue on the official careers channel. We never submit an application in your name.
                        </p>
                      )}
                      {selected.gaps.length > 0 ? (
                        <ul className="space-y-2">
                          {selected.gaps.map((g) => (
                            <li key={g}>
                              <label className="flex items-start gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  className="mt-1"
                                  checked={Boolean(ticks[g])}
                                  onChange={(e) =>
                                    setTicks((prev) => ({ ...prev, [g]: e.target.checked }))
                                  }
                                />
                                <span>{g}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {gate === "NEEDS_CONFIRMATION" ? (
                        <Button type="button" variant="outline" onClick={confirmSelected}>
                          Log confirmations
                        </Button>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="solid" onClick={applySelected}>
                          Apply via official channel
                        </Button>
                        <Button type="button" variant="outline" onClick={draftSelected}>
                          Draft cover message
                        </Button>
                      </div>
                      {selected.apply ? (
                        <p className="text-sm leading-6 text-kc-ink/80">
                          {selected.apply.note}
                          {selected.apply.applyUrl ? (
                            <>
                              {" "}
                              <a className="font-medium underline underline-offset-4" href={selected.apply.applyUrl} target="_blank" rel="noreferrer">
                                Open portal
                              </a>
                            </>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                  )}
                </section>

                {selected.draftText && gate !== "BLOCKED" ? (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold">Cover draft</h3>
                    <textarea readOnly rows={8} value={selected.draftText} className={`${fieldClass} mt-2 bg-kc-muted`} />
                  </div>
                ) : null}

                {gate !== "BLOCKED" ? (
                  <details className="mt-4 rounded-2xl border border-kc-ink/10 p-4">
                    <summary className="cursor-pointer text-sm font-semibold">Skill match (after trust gate)</summary>
                    <textarea
                      id="cv"
                      rows={4}
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      placeholder="Paste your CV text…"
                      className={`${fieldClass} mt-3`}
                    />
                    <div className="mt-3">
                      <Button type="button" variant="lime" onClick={matchSelected}>
                        Run skill match
                      </Button>
                    </div>
                    {matchScore !== null ? (
                      <p className="mt-2 text-sm">Compatibility {matchScore}/100</p>
                    ) : null}
                  </details>
                ) : null}

                {selectedCheck?.findings?.length ? (
                  <div className="mt-6">
                    <h2 className="text-base font-semibold">Findings</h2>
                    <p className="mt-1 text-xs text-kc-gray">Flagged items first. Passed checks stay folded away.</p>
                    <div className="mt-3">
                      <CheckFindings findings={selectedCheck.findings} />
                    </div>
                  </div>
                ) : null}
              </BrutalCard>
              {selectedCheck ? <OfficialOrgSidebar check={selectedCheck} /> : null}
            </div>
          ) : (
            <BrutalCard tone="white" className="flex min-h-64 items-center">
              <p className="max-w-sm text-sm leading-6 text-kc-ink/70">
                Check a batch to fill the inbox. Then pick one ad — you will see the decision and the next allowed action first.
              </p>
            </BrutalCard>
          )}
        </div>
      </div>
    </div>
  );
}
