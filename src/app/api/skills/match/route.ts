import { NextResponse } from "next/server";
import { skillMatchSchema } from "@/lib/http/schemas";
import { runSkillMatch } from "@/lib/skills/match";
import { memorySaveSkillMatch } from "@/lib/store/memory";

export const instant = false;

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = skillMatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const result = runSkillMatch(parsed.data);
  memorySaveSkillMatch(result);
  return NextResponse.json(result, { status: 201 });
}
