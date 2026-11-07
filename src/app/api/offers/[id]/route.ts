import { NextResponse } from "next/server";
import { memoryGetOffer } from "@/lib/store/memory";

export const instant = false;

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  context: { params: Params },
) {
  const { id } = await context.params;
  const record = memoryGetOffer(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(record);
}
