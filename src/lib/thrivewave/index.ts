/**
 * ThriveWave SMS / USSD client scaffold.
 * BE-1: replace with real HTTP calls using THRIVEWAVE_* env vars.
 */

export type SmsPayload = {
  phone: string;
  message: string;
};

export type SmsResult = {
  ok: boolean;
  providerId?: string;
  stub: boolean;
  error?: string;
};

export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  const apiKey = process.env.THRIVEWAVE_API_KEY;
  if (!apiKey) {
    return {
      ok: true,
      stub: true,
      providerId: `stub_${Date.now()}`,
    };
  }

  // Real integration placeholder
  void payload;
  return {
    ok: false,
    stub: false,
    error: "ThriveWave HTTP client not implemented; see backend issue",
  };
}

export function formatVerdictSms(input: {
  verdict: string;
  checkId: string;
  topEvidence: string[];
  appUrl?: string;
}): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const lines = [
    `Kazi Check: ${input.verdict}`,
    ...input.topEvidence.slice(0, 2).map((e) => `• ${e}`),
    `${base}/checks/${input.checkId}`,
  ];
  return lines.join("\n");
}

export type UssdRequest = {
  sessionId: string;
  msisdn: string;
  input: string;
  accessPoint?: string;
};

export type UssdResponse = {
  body: string; // CON ... or END ...
};

/** Simple stateful USSD menu scaffold (in-memory per process). */
const sessions = new Map<string, { step: "menu" | "offer" | "applicant" }>();

export function handleUssd(req: UssdRequest): UssdResponse {
  const session = sessions.get(req.sessionId) ?? { step: "menu" as const };
  const input = (req.input ?? "").trim();

  if (session.step === "menu") {
    if (!input || input === "") {
      return {
        body: "CON Kazi Check\n1. Check job offer\n2. Check applicant\n3. Help",
      };
    }
    if (input === "1") {
      sessions.set(req.sessionId, { step: "offer" });
      return { body: "CON Paste short job ad text or domain:" };
    }
    if (input === "2") {
      sessions.set(req.sessionId, { step: "applicant" });
      return { body: "CON Paste applicant claim or email:" };
    }
    if (input === "3") {
      sessions.delete(req.sessionId);
      return {
        body: "END Paste a job ad or applicant text on the web app for full evidence.",
      };
    }
    return { body: "CON Invalid option. 1 Offer 2 Applicant 3 Help" };
  }

  // Lite verdict hint; full pipeline called from webhook route
  sessions.delete(req.sessionId);
  const preview = input.slice(0, 40);
  return {
    body: `END Received. Run full check on web for: ${preview}${input.length > 40 ? "…" : ""}`,
  };
}
