import { NextResponse } from "next/server";
import { memoryGetSubject } from "@/lib/store/memory";

export const instant = false;

type Params = Promise<{ subjectId: string }>;

export async function GET(
  _request: Request,
  context: { params: Params },
) {
  const { subjectId } = await context.params;
  const subject = memoryGetSubject(subjectId);
  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }
  return NextResponse.json(subject);
}
