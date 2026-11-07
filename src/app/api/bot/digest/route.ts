import { NextResponse } from "next/server";
import { z } from "zod";
import { sendBatchDigest } from "@/lib/bot/digest";
import { memoryListBotQueue, memorySaveBotItem } from "@/lib/store/memory";

export const instant = false;

const schema = z.object({
  phone: z.string().min(9),
  dryRun: z.boolean().optional(),
});

export async function POST(request: Request) {
  const url = new URL(request.url);
  const json = await request.json().catch(() => ({}));
  const parsed = schema.safeParse({
    ...json,
    dryRun: json.dryRun === true || url.searchParams.get("dry-run") === "1",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }
  const items = memoryListBotQueue().map((item) => {
    if (item.notifyPhone) return item;
    const next = { ...item, notifyPhone: parsed.data.phone };
    memorySaveBotItem(next);
    return next;
  });
  const result = await sendBatchDigest({
    phone: parsed.data.phone,
    items,
    dryRun: parsed.data.dryRun,
  });
  return NextResponse.json(result);
}
