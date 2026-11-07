"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { BotQueueItem } from "@/lib/types";
import { displayVerdict } from "@/lib/verdict";

type UploadResponse = {
  items: BotQueueItem[];
  table: { ad: string; verdict: string; gate: string; reason: string }[];
  errors?: { filename: string; reason: string }[];
  truncated?: number;
};

export default function BotPage() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [items, setItems] = useState<BotQueueItem[]>([]);
  const [table, setTable] = useState<UploadResponse["table"]>([]);
  const [errors, setErrors] = useState<UploadResponse["errors"]>([]);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [digest, setDigest] = useState<string | null>(null);
  const [selected, setSelected] = useState<BotQueueItem | null>(null);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [cvText, setCvText] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/bot/queue");
    const data = await res.json();
    setItems(data.items ?? []);
    setTable(data.table ?? []);
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

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
      setTable(data.table);
      setErrors(data.errors);
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
      data.dryRun
        ? `Dry run (no SMS sent): ${data.message}`
        : data.message ?? "Queued",
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

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel>Job Bot</SectionLabel>
      <p className="mt-6 max-w-2xl text-lg text-kc-ink/80">
        Upload ads (including screenshots). Verify, then apply on the official
        careers portal with a draft ready. Blocked ads never get an application.
        We never apply on WhatsApp or submit a form in your name.
      </p>

      <BrutalCard className="mt-10" tone="muted">
        <label className="mb-2 block text-sm font-medium" htmlFor="bot-text">
          Paste an ad (optional if you upload a file)
        </label>
        <textarea
          id="bot-text"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Acme Roads Authority hiring 800 staff…"
          className="w-full resize-y rounded-2xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-base text-kc-ink"
        />
        <label className="mb-2 mt-6 block text-sm font-medium" htmlFor="bot-files">
          Files: .txt, .csv, .pdf, screenshots (.png/.jpg, OCR) — max 20 ads, 5MB each
        </label>
        <input
          id="bot-files"
          type="file"
          multiple
          accept=".txt,.csv,.pdf,.png,.jpg,.jpeg"
          onChange={(e) => setFiles(e.target.files)}
        />
        <div className="mt-6">
          <Button type="button" variant="solid" onClick={onUpload} disabled={busy}>
            {busy ? "Checking…" : "Check batch"}
          </Button>
        </div>
        {message ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{message}</p> : null}
        {errors && errors.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm">
            {errors.map((e) => (
              <li key={e.filename}>
                {e.filename}: {e.reason}
              </li>
            ))}
          </ul>
        ) : null}
      </BrutalCard>

      <section className="mt-12">
        <h2 className="text-2xl font-medium">Queue</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border-2 border-kc-ink">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-kc-muted">
              <tr>
                <th className="px-4 py-3">Ad</th>
                <th className="px-4 py-3">Verdict</th>
                <th className="px-4 py-3">Gate</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {table.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-kc-gray" colSpan={4}>
                    No ads in this session yet.
                  </td>
                </tr>
              ) : (
                table.map((row, i) => {
                  const item = items[i];
                  return (
                    <tr
                      key={row.ad + i}
                      className="cursor-pointer border-t-2 border-kc-ink/20 hover:bg-kc-muted/60"
                      onClick={() => {
                        if (item) {
                          setSelected(item);
                          setTicks({});
                          setMatchScore(null);
                        }
                      }}
                    >
                      <td className="px-4 py-3">{row.ad}</td>
                      <td className="px-4 py-3">
                        {item?.verdict ? displayVerdict(item.verdict) : row.verdict}
                      </td>
                      <td className="px-4 py-3">{row.gate}</td>
                      <td className="px-4 py-3">{row.reason}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <BrutalCard className="mt-10" tone="white">
          <p className="text-sm uppercase tracking-wide text-kc-gray">{selected.id}</p>
          <h3 className="mt-2 text-3xl font-medium">
            {selected.verdict ? displayVerdict(selected.verdict) : selected.status}
          </h3>
          <p className="mt-2 text-sm">Gate: {selected.gate ?? selected.status}</p>
          {selected.gate === "BLOCKED" ? (
            <p className="mt-4 text-sm">
              Blocked. Review evidence on the check page and report. No drafting.
            </p>
          ) : null}

          {selected.gaps.length > 0 ? (
            <div className="mt-6">
              <p className="text-sm font-medium">Gaps — tick each to continue if Caution or Unsure</p>
              <ul className="mt-3 space-y-2">
                {selected.gaps.map((g) => (
                  <li key={g}>
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(ticks[g])}
                        onChange={(e) =>
                          setTicks((prev) => ({ ...prev, [g]: e.target.checked }))
                        }
                        disabled={selected.gate === "BLOCKED"}
                      />
                      <span>{g}</span>
                    </label>
                  </li>
                ))}
              </ul>
              {selected.gate === "NEEDS_CONFIRMATION" ? (
                <div className="mt-4">
                  <Button type="button" variant="outline" onClick={confirmSelected}>
                    Log confirmations
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {selected.checkId ? (
            <div className="mt-4">
              <Button href={`/checks/${selected.checkId}`} variant="outline">
                Open evidence card
              </Button>
            </div>
          ) : null}

          {selected.gate !== "BLOCKED" ? (
            <div className="mt-8 space-y-4">
              <Button type="button" variant="solid" onClick={applySelected}>
                Apply via official channel
              </Button>
              <Button type="button" variant="outline" onClick={draftSelected}>
                Draft cover message
              </Button>
              {selected.apply ? (
                <p className="text-sm">
                  {selected.apply.note}
                  {selected.apply.applyUrl ? (
                    <>
                      {" "}
                      <a
                        className="underline"
                        href={selected.apply.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open portal
                      </a>
                    </>
                  ) : null}
                </p>
              ) : null}
              {selected.draftText ? (
                <textarea
                  readOnly
                  rows={12}
                  value={selected.draftText}
                  className="w-full rounded-2xl border-2 border-kc-ink bg-kc-muted px-4 py-3 text-sm"
                />
              ) : null}
              <label className="block text-sm font-medium" htmlFor="cv">
                Skill match (after trust gate)
              </label>
              <textarea
                id="cv"
                rows={5}
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Paste your CV text…"
                className="w-full rounded-2xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-sm text-kc-ink"
              />
              <Button type="button" variant="lime" onClick={matchSelected}>
                Run skill match
              </Button>
              {matchScore !== null ? (
                <p className="text-sm">Compatibility {matchScore}/100</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-6">
              <Button href="/registry" variant="outline">
                Report in registry
              </Button>
            </div>
          )}
        </BrutalCard>
      ) : null}

      <BrutalCard className="mt-10" tone="muted">
        <p className="font-medium">Batch SMS digest</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XXXXXXXX"
            className="min-w-[200px] flex-1 rounded-xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-kc-ink"
          />
          <Button type="button" variant="outline" onClick={() => onDigest(true)}>
            Dry run
          </Button>
          <Button type="button" variant="lime" onClick={() => onDigest(false)}>
            Send SMS
          </Button>
        </div>
        {digest ? <p className="mt-3 text-sm">{digest}</p> : null}
      </BrutalCard>
    </div>
  );
}
