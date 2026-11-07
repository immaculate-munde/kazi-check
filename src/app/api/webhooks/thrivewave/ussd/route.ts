import { NextResponse } from "next/server";
import { runCheckPipeline } from "@/lib/pipeline/run-check";
import { handleUssd } from "@/lib/thrivewave";
import type { CheckDirection } from "@/lib/types";

export const instant = false;

/**
 * ThriveWave USSD callback scaffold.
 * Expects JSON: { sessionId, msisdn, input, accessPoint? }
 * Responds with { body: "CON ..." | "END ..." } — adapt to provider schema later.
 */
export async function POST(request: Request) {
  const secret = process.env.THRIVEWAVE_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-thrivewave-secret");
    if (header !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const payload = await request.json();
  const sessionId = String(payload.sessionId ?? payload.sessionID ?? "anon");
  const msisdn = String(payload.msisdn ?? "");
  const input = String(payload.input ?? "");

  // First pass: menu navigation
  const menu = handleUssd({ sessionId, msisdn, input });

  // If user submitted text after choosing a mode, run lite check
  const direction: CheckDirection | null = input.length > 8
    ? guessDirectionFromSessionBody(menu.body)
    : null;

  if (direction && input.length > 8 && !menu.body.startsWith("CON")) {
    try {
      const check = await runCheckPipeline({ direction, text: input });
      return NextResponse.json({
        body: `END ${check.verdict}. Evidence: ${
          check.evidence[0]?.title ?? "none"
        }. Full: /checks/${check.id}`,
        checkId: check.id,
        verdict: check.verdict,
      });
    } catch {
      return NextResponse.json(menu);
    }
  }

  return NextResponse.json(menu);
}

function guessDirectionFromSessionBody(body: string): CheckDirection | null {
  // After menu selection handleUssd returns END for text step — direction lost in stub.
  // Scaffold: default job_offer for long free-text posts.
  void body;
  return "job_offer";
}
