import { NextResponse } from "next/server";
import { memoryListRegistry } from "@/lib/store/memory";
import type { CheckDirection } from "@/lib/types";

export const instant = false;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") as CheckDirection | null;
  const items = memoryListRegistry(
    direction === "job_offer" || direction === "applicant"
      ? direction
      : undefined,
  );
  return NextResponse.json({ items });
}
