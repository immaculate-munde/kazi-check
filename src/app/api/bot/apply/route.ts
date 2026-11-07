import { NextResponse } from "next/server";
import { z } from "zod";
import { buildApplyPacket, recordApply } from "@/lib/bot/apply";
import { getCheck } from "@/lib/store";
import { memoryGetBotItem } from "@/lib/store/memory";

export const instant = false;

const schema = z.object({ id: z.string() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const item = memoryGetBotItem(parsed.data.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const check = item.checkId ? await getCheck(item.checkId) : null;
  const built = buildApplyPacket(item, check);
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }

  const updated = await recordApply(item, built.packet);
  return NextResponse.json(updated);
}
