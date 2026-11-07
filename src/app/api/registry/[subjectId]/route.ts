import { NextResponse } from "next/server";
import { getSubject } from "@/lib/store";

export const instant = false;

type Params = Promise<{ subjectId: string }>;

export async function GET(
  _request: Request,
  context: { params: Params },
) {
  const { subjectId } = await context.params;
  const subject = await getSubject(subjectId);
  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }
  return NextResponse.json(subject);
}
