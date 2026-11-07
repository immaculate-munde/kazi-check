"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { PageIntro } from "@/components/ui/PageIntro";

function SkillsForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [jobText, setJobText] = useState("");
  const [cvText, setCvText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/skills/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobText,
          cvText,
          jobTitle: jobTitle || undefined,
          checkId: search.get("checkId") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Match failed");
      router.push(`/skills/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8 md:py-12">
      <PageIntro kicker="After the trust gate" title="Skill match">
        Compare a job description with your CV. Compatibility is guidance, not a
        hiring probability.
      </PageIntro>
      <BrutalCard tone="white" className="mt-8">
        <form className="space-y-5" onSubmit={onSubmit}>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Job title (optional)"
            className="kc-field"
          />
          <textarea
            required
            rows={8}
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste the job description…"
            className="kc-field"
          />
          <textarea
            required
            rows={8}
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder="Paste your CV or skills summary…"
            className="kc-field"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" variant="lime" disabled={loading}>
            {loading ? "Matching…" : "Run skill match"}
          </Button>
        </form>
        <div className="mt-4">
          <Button href="/quiz" variant="outline">
            Take a domain quiz
          </Button>
        </div>
      </BrutalCard>
    </div>
  );
}

export default function SkillsPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading…</div>}>
      <SkillsForm />
    </Suspense>
  );
}
