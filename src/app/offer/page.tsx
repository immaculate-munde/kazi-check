"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";

export default function OfferPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/offer/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel>Post-offer check</SectionLabel>
      <p className="mt-6 text-lg text-kc-ink/80">
        Paste an offer letter or HR email before you accept, pay, or share more
        personal information.
      </p>
      <BrutalCard className="mt-8" tone="muted">
        <form className="space-y-5" onSubmit={onSubmit}>
          <textarea
            required
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the employment offer text…"
            className="w-full rounded-2xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-kc-ink"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" variant="solid" disabled={loading}>
            {loading ? "Analyzing…" : "Analyse offer"}
          </Button>
        </form>
      </BrutalCard>
    </div>
  );
}
