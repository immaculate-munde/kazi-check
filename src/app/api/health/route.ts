import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "kazi-check",
    ts: new Date().toISOString(),
  });
}
