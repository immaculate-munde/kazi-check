import { NextResponse } from "next/server";
import { listRegistry } from "@/lib/store";
import type { CheckDirection } from "@/lib/types";

export const instant = false;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") as CheckDirection | null;
  const items = await listRegistry(
    direction === "job_offer" || direction === "applicant"
      ? direction
      : undefined,
  );
  return NextResponse.json({ items });
}
