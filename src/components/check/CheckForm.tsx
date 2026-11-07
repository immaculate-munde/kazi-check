"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import type { CheckDirection } from "@/lib/types";

export function CheckForm({ direction }: { direction: CheckDirection }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | null) {
    if (!file) return;
    const raw = await file.text();
    setText((prev) => (prev ? `${prev}\n\n${raw}` : raw));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() && !url.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          text,
          url: url.trim() || undefined,
          phone_for_sms: phone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Check failed");
      }
      router.push(`/checks/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <BrutalCard tone="muted">
      <form className="space-y-6" onSubmit={onSubmit}>
        <div>
          <label htmlFor="ad-text" className="mb-2 block text-sm font-medium">
            {direction === "applicant"
              ? "Applicant message / claims"
              : "Job ad / recruiter message"}
          </label>
          <textarea
            id="ad-text"
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              direction === "applicant"
                ? "Paste CV summary, email, or LinkedIn outreach…"
                : "Paste the full job ad text here…"
            }
            className="w-full resize-y rounded-2xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-base text-kc-ink outline-none focus:ring-2 focus:ring-kc-lime"
          />
        </div>

        <div>
          <label htmlFor="url" className="mb-2 block text-sm font-medium">
            Advert URL (optional)
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-2xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-base text-kc-ink outline-none focus:ring-2 focus:ring-kc-lime"
          />
        </div>

        <div>
          <label htmlFor="file" className="mb-2 block text-sm font-medium">
            Upload text/PDF-as-text file (optional)
          </label>
          <input
            id="file"
            type="file"
            accept=".txt,.md,.csv,.json,text/plain"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          <p className="mt-1 text-xs text-kc-gray">
            Tip: paste PDF text, or upload a .txt export. Full OCR comes later.
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium">
            Phone for SMS verdict (optional)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XXXXXXXX"
            className="w-full rounded-2xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-base text-kc-ink outline-none focus:ring-2 focus:ring-kc-lime"
          />
        </div>

        {error ? (
          <p className="rounded-xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="solid" disabled={submitting}>
            {submitting ? "Analyzing…" : "Run check"}
          </Button>
          <Button
            href={
              direction === "applicant"
                ? "/check?direction=job_offer"
                : "/check?direction=applicant"
            }
            variant="outline"
          >
            Switch to {direction === "applicant" ? "job offer" : "applicant"}
          </Button>
        </div>
      </form>
    </BrutalCard>
  );
}
