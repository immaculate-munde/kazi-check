import { NextResponse } from "next/server";
import { trackerSchema } from "@/lib/http/schemas";
import {
  memoryDeleteTracker,
  memoryListTracker,
  memoryUpsertTracker,
} from "@/lib/store/memory";

export const instant = false;

export async function GET() {
  return NextResponse.json({ items: memoryListTracker() });
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = trackerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const item = memoryUpsertTracker(parsed.data);
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  memoryDeleteTracker(id);
  return NextResponse.json({ ok: true });
}
