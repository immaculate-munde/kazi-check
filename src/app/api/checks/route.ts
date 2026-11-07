import { NextResponse } from "next/server";
import { createCheckSchema } from "@/lib/http/schemas";
import { runCheckPipeline } from "@/lib/pipeline/run-check";
import { formatVerdictSms, sendSms } from "@/lib/thrivewave";

export const instant = false;

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = createCheckSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { direction, text, url, phone_for_sms } = parsed.data;
    if (!text?.trim() && !url?.trim()) {
      return NextResponse.json(
        { error: "Provide text or url" },
        { status: 400 },
      );
    }

    const check = await runCheckPipeline({
      direction,
      text: text ?? "",
      url: url || undefined,
      notifyPhone: phone_for_sms?.trim(),
    });

    let sms: { ok: boolean; stub?: boolean } | undefined;
    if (phone_for_sms?.trim()) {
      sms = await sendSms({
        phone: phone_for_sms.trim(),
        message: formatVerdictSms({
          verdict: check.verdict,
          checkId: check.id,
          topEvidence: check.evidence.map((e) => e.title),
        }),
      });
    }

    return NextResponse.json({ ...check, sms }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
