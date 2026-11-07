"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import type { CheckDirection } from "@/lib/types";

export function CheckForm({ direction }: { direction: CheckDirection }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          text,
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
            required
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              direction === "applicant"
                ? "Paste CV summary, email, or LinkedIn outreach…"
                : "Paste the full job ad text here…"
            }
            className="w-full resize-y rounded-2xl border-2 border-kc-ink bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-kc-lime"
          />
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
            className="w-full rounded-2xl border-2 border-kc-ink bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-kc-lime"
          />
        </div>

        {error ? (
          <p className="rounded-xl border-2 border-kc-ink bg-white px-4 py-3 text-sm text-red-700">
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
