import { NextResponse } from "next/server";
import { getRequestFingerprint } from "@/lib/http/fingerprint";
import { flagSchema } from "@/lib/http/schemas";
import { addFlag } from "@/lib/store";
import { dispatchRetroAlerts } from "@/lib/bot/retro";

export const instant = false;

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = flagSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const fingerprintHash = await getRequestFingerprint();
    const result = await addFlag({
      ...parsed.data,
      fingerprintHash,
    });

    let retroAlerts: Awaited<ReturnType<typeof dispatchRetroAlerts>> = [];
    if (!result.alreadyFlagged) {
      retroAlerts = await dispatchRetroAlerts({
        subjectId: result.subjectId,
        reason: result.reason,
      });
    }

    return NextResponse.json(
      { ...result, retroAlerts },
      {
        status: result.alreadyFlagged ? 200 : 201,
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Flag failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
