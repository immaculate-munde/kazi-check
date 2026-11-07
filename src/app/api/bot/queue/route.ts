import { NextResponse } from "next/server";
import { listBotQueue } from "@/lib/store";
import { queueTable } from "@/lib/bot/process";

export const instant = false;

export async function GET() {
  const items = await listBotQueue();
  return NextResponse.json({ items, table: queueTable(items) });
}
