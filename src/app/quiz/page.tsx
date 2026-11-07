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

export default function QuizPage() {
  const [domain, setDomain] = useState("ICT Support");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    feedback: string[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/skills/quiz?domain=${encodeURIComponent(domain)}`)
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions ?? []);
        setAnswers({});
        setResult(null);
      });
  }, [domain]);

  async function submit() {
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
    setResult(await res.json());
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel>Domain quiz</SectionLabel>
      <p className="mt-6 text-lg text-kc-ink/80">
        Short assessments for practical reasoning. Pick a domain and answer a few
        questions.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {["ICT Support", "Networking", "Cybersecurity", "Software Development", "Human Resources"].map(
          (d) => (
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
          ),
        )}
      </div>

      <BrutalCard className="mt-8 space-y-6" tone="muted">
        {questions.map((q, idx) => (
          <div key={q.id}>
            <p className="font-medium">
              {idx + 1}. {q.prompt}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, i) => (
                <label
                  key={opt}
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
        <Button variant="solid" onClick={submit}>
          Submit quiz
        </Button>
      </BrutalCard>

      {result ? (
        <BrutalCard className="mt-6" tone="lime">
          <h2 className="text-2xl font-medium text-[#191a23]">
            Score {result.score}/{result.total}
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#191a23]/80">
            {result.feedback.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <Button href="/skills" className="mt-6" variant="outline">
            Back to skill match
          </Button>
        </BrutalCard>
      ) : null}
    </div>
  );
}
