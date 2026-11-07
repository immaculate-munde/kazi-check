import { NextResponse } from "next/server";
import { memoryGetCheck } from "@/lib/store/memory";

export const instant = false;

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  context: { params: Params },
) {
  const { id } = await context.params;
  const check = memoryGetCheck(id);
  if (!check) {
    return NextResponse.json({ error: "Check not found" }, { status: 404 });
  }
  return NextResponse.json(check);
}
