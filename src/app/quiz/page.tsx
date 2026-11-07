"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";

type Q = {
  id: string;
  domain: string;
  prompt: string;
  options: string[];
  explanation?: string;
};

type QuizResultView = {
  score: number;
  total: number;
  feedback: string[];
};

export default function QuizPage() {
  const [domain, setDomain] = useState("ICT Support");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResultView | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    fetch(`/api/skills/quiz?domain=${encodeURIComponent(domain)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Could not load quiz");
        if (!cancelled) {
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
          setAnswers({});
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setQuestions([]);
          setError(err instanceof Error ? err.message : "Could not load quiz");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [domain]);

  async function submit() {
    setError(null);
    if (questions.length === 0) {
      setError("No questions loaded. Pick a domain again or refresh.");
      return;
    }
    const unanswered = questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      setError(`Answer all questions before submitting (${unanswered.length} left).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/skills/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          answers: questions.map((q) => ({
            questionId: q.id,
            selectedIndex: answers[q.id] ?? -1,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Submit failed");
      }
      setResult({
        score: data.score ?? 0,
        total: data.total ?? questions.length,
        feedback: Array.isArray(data.feedback) ? data.feedback : [],
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel>Domain quiz</SectionLabel>
      <p className="mt-6 text-lg text-kc-ink/80">
        Short assessments for practical reasoning. Pick a domain and answer a few
        questions.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          "ICT Support",
          "Networking",
          "Cybersecurity",
          "Software Development",
          "Human Resources",
        ].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDomain(d)}
            className={`rounded-full border-2 border-kc-ink px-4 py-2 text-sm ${
              domain === d ? "bg-kc-lime text-[#191a23]" : "bg-kc-white"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <BrutalCard className="mt-8 space-y-6" tone="muted">
        {loading ? <p className="text-sm text-kc-ink/70">Loading questions…</p> : null}
        {!loading && questions.length === 0 ? (
          <p className="text-sm text-red-600">
            No questions available for this domain. Try another domain.
          </p>
        ) : null}
        {questions.map((q, idx) => (
          <div key={q.id}>
            <p className="font-medium">
              {idx + 1}. {q.prompt}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, i) => (
                <label
                  key={`${q.id}-${i}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-kc-ink bg-kc-white px-3 py-2"
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === i}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          variant="solid"
          onClick={submit}
          disabled={submitting || loading || questions.length === 0}
        >
          {submitting ? "Submitting…" : "Submit quiz"}
        </Button>
      </BrutalCard>

      {result ? (
        <BrutalCard className="mt-6" tone="lime">
          <h2 className="text-2xl font-medium text-[#191a23]">
            Score {result.score}/{result.total}
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#191a23]/80">
            {result.feedback.map((f, i) => (
              <li key={`${i}-${f.slice(0, 24)}`}>{f}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/skills" variant="outline">
              Back to skill match
            </Button>
            <Button
              type="button"
              variant="solid"
              onClick={() => {
                setResult(null);
                setAnswers({});
                setError(null);
              }}
            >
              Retake quiz
            </Button>
          </div>
        </BrutalCard>
      ) : null}
    </div>
  );
}
