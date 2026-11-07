import { NextResponse } from "next/server";
import { z } from "zod";
import { canDraft } from "@/lib/bot/gate";
import { runSkillMatch } from "@/lib/skills/match";
import { getBotItem } from "@/lib/store";
import { memorySaveSkillMatch } from "@/lib/store/memory";

export const instant = false;

const schema = z.object({
  id: z.string(),
  cvText: z.string().min(20),
});

/** Skill match runs only for ELIGIBLE or confirmed ads — outside verifier scoring. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const item = await getBotItem(parsed.data.id);
  if (!item?.gate) {
    return NextResponse.json({ error: "Ad not ready" }, { status: 400 });
  }
  const confirmed = (item.confirmedGaps?.length ?? 0) > 0;
  if (!canDraft(item.gate, confirmed)) {
    return NextResponse.json(
      { error: "Match is only available after the trust gate" },
      { status: 400 },
    );
  }
  const result = runSkillMatch({
    jobText: item.maskedText,
    cvText: parsed.data.cvText,
    checkId: item.checkId,
  });
  memorySaveSkillMatch(result);
  return NextResponse.json(result, { status: 201 });
}
