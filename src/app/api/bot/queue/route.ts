import { NextResponse } from "next/server";
import { memoryListBotQueue } from "@/lib/store/memory";
import { queueTable } from "@/lib/bot/process";

export const instant = false;

export async function GET() {
  const items = memoryListBotQueue();
  return NextResponse.json({ items, table: queueTable(items) });
}
