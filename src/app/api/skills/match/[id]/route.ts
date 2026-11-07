import { NextResponse } from "next/server";
import { memoryGetSkillMatch } from "@/lib/store/memory";

export const instant = false;

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  context: { params: Params },
) {
  const { id } = await context.params;
  const record = memoryGetSkillMatch(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(record);
}
