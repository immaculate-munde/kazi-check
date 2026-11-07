import { NextResponse } from "next/server";
import { z } from "zod";
import { getBotItem, saveBotItem } from "@/lib/store";

export const instant = false;

const schema = z.object({
  id: z.string(),
  confirmedGaps: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const item = await getBotItem(parsed.data.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.gate === "BLOCKED") {
    return NextResponse.json({ error: "Blocked ads cannot be confirmed" }, { status: 400 });
  }
  const missing = item.gaps.filter((g) => !parsed.data.confirmedGaps.includes(g));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Tick every gap before continuing", missing },
      { status: 400 },
    );
  }
  const updated = {
    ...item,
    confirmedGaps: parsed.data.confirmedGaps,
    updatedAt: new Date().toISOString(),
  };
  await saveBotItem(updated);
  return NextResponse.json(updated);
}
