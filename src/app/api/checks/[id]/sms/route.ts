import { NextResponse } from "next/server";
import { smsSchema } from "@/lib/http/schemas";
import { memoryGetCheck } from "@/lib/store/memory";
import { formatVerdictSms, sendSms } from "@/lib/thrivewave";

export const instant = false;

type Params = Promise<{ id: string }>;

export async function POST(
  request: Request,
  context: { params: Params },
) {
  const { id } = await context.params;
  const check = memoryGetCheck(id);
  if (!check) {
    return NextResponse.json({ error: "Check not found" }, { status: 404 });
  }

  const json = await request.json();
  const parsed = smsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await sendSms({
    phone: parsed.data.phone,
    message: formatVerdictSms({
      verdict: check.verdict,
      checkId: check.id,
      topEvidence: check.evidence.map((e) => e.title),
    }),
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
