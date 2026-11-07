import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { quizSubmitSchema } from "@/lib/http/schemas";
import { pickQuiz, QUIZ_BANK } from "@/lib/skills/quiz-bank";
import { memorySaveQuiz } from "@/lib/store/memory";

export const instant = false;

export async function GET(request: Request) {
  const domain = new URL(request.url).searchParams.get("domain") ?? undefined;
  const questions = pickQuiz(domain, 3).map(({ answerIndex: _, ...q }) => {
    void _;
    return q;
  });
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = quizSubmitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let correct = 0;
  const feedback: string[] = [];
  for (const answer of parsed.data.answers) {
    const q = QUIZ_BANK.find((item) => item.id === answer.questionId);
    if (!q) continue;
    const ok = answer.selectedIndex === q.answerIndex;
    if (ok) correct += 1;
    feedback.push(
      `${ok ? "Correct" : "Incorrect"}: ${q.prompt} ${q.explanation}`,
    );
  }

  const total = parsed.data.answers.length || 1;
  const result = memorySaveQuiz({
    id: `quiz_${randomUUID().slice(0, 8)}`,
    domain: parsed.data.domain ?? "General",
    score: correct,
    total,
    feedback,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json(result, { status: 201 });
}
