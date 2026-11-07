import { NextResponse } from "next/server";
import { z } from "zod";
import { canDraft } from "@/lib/bot/gate";
import { draftApplication } from "@/lib/bot/draft";
import { memoryGetBotItem, memoryGetCheck, memorySaveBotItem } from "@/lib/store/memory";

export const instant = false;

const schema = z.object({ id: z.string() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const item = memoryGetBotItem(parsed.data.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!item.gate) {
    return NextResponse.json({ error: "Ad is not gated yet" }, { status: 400 });
  }
  const confirmed = (item.confirmedGaps?.length ?? 0) > 0;
  if (!canDraft(item.gate, confirmed)) {
    return NextResponse.json(
      { error: "Drafting is blocked until the ad is eligible or every gap is confirmed" },
      { status: 400 },
    );
  }

  const check = item.checkId ? memoryGetCheck(item.checkId) : null;
  const jobTitle =
    check && "jobTitle" in check.extracted ? check.extracted.jobTitle : null;
  const draftText = draftApplication(item.maskedText, jobTitle);
  const updated = {
    ...item,
    status: "drafted" as const,
    draftText,
    updatedAt: new Date().toISOString(),
  };
  memorySaveBotItem(updated);
  return NextResponse.json(updated);
}
