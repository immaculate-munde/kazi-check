"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { PageIntro } from "@/components/ui/PageIntro";

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
    <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8 md:py-12">
      <PageIntro kicker="Post-offer" title="Check an offer letter">
        Paste an offer letter or HR email before you accept, pay, or share more
        personal information.
      </PageIntro>
      <BrutalCard className="mt-8" tone="white">
        <form className="space-y-5" onSubmit={onSubmit}>
          <textarea
            required
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the employment offer text…"
            className="kc-field leading-7"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" variant="lime" disabled={loading}>
            {loading ? "Analyzing…" : "Analyse offer"}
          </Button>
        </form>
      </BrutalCard>
    </div>
  );
}
