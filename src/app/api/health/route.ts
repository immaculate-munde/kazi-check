import { NextResponse } from "next/server";
import { storeBackend } from "@/lib/store";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "kazi-check",
    store: storeBackend(),
    ts: new Date().toISOString(),
  });
}
