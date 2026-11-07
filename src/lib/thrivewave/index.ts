/**
 * ThriveWave/ThriveVas SMS / USSD client.
 * BE-1: Real HTTP implementation using THRIVEWAVE_* env vars.
 * API Docs: https://sms.thrivevas.com
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

interface ThriveVasSmsResponse {
  status: number;
  message: string;
  transaction_id?: number;
  [key: string]: unknown;
}

interface ThriveWaveConfig {
  apiKey: string;
  shortCode?: string;
  baseUrl: string;
}

function getConfig(): ThriveWaveConfig | null {
  const apiKey = process.env.THRIVEWAVE_API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    shortCode: process.env.THRIVEWAVE_SHORT_CODE,
    baseUrl: process.env.THRIVEWAVE_BASE_URL ?? "https://sms.thrivevas.com",
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 15000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  backoffMs = 1000,
  timeoutMs = 15000,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);

      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries) {
          const retryAfter = response.headers.get("retry-after");
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoffMs * 2 ** attempt;
          await sleep(waitMs);
          continue;
        }
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await sleep(backoffMs * 2 ** attempt);
      }
    }
  }

  throw lastError ?? new Error("Fetch failed after retries");
}

/**
 * Normalize Kenya phone numbers to +254XXXXXXXXX format (required by ThriveVas).
 * Accepts: 07XXXXXXXX, 2547XXXXXXXX, +2547XXXXXXXX, 01XXXXXXXX, 2541XXXXXXXX
 */
export function normalizeKenyaPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-]/g, "");

  // Already in +254 format
  if (cleaned.match(/^\+254[17]\d{8}$/)) {
    return cleaned;
  }

  // Already in 254 format (no +)
  if (cleaned.match(/^254[17]\d{8}$/)) {
    return "+" + cleaned;
  }

  // 07 or 01 format
  if (cleaned.match(/^0[17]\d{8}$/)) {
    return "+254" + cleaned.slice(1);
  }

  // 7 or 1 format (9 digits)
  if (cleaned.match(/^[17]\d{8}$/)) {
    return "+254" + cleaned;
  }

  return null;
}

export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  const config = getConfig();
  if (!config) {
    // Stub mode - no API key configured
    console.log("[ThriveVas] No API key configured - running in stub mode");
    return {
      ok: true,
      stub: true,
      providerId: `stub_${Date.now()}`,
    };
  }

  const { phone, message } = payload;

  // Validate and normalize phone number format (ThriveVas requires +254XXXXXXXXX)
  const normalizedPhone = normalizeKenyaPhone(phone);
  if (!normalizedPhone) {
    console.error("[ThriveVas] Invalid phone number:", phone);
    return {
      ok: false,
      stub: false,
      error: `Invalid phone number format: ${phone}. Use +2547XXXXXXXX, 07XXXXXXXX, or 2547XXXXXXXX`,
    };
  }

  // ThriveVas SMS API endpoint
  const url = `${config.baseUrl}/v1/message/send`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": config.apiKey,
  };

  const body: Record<string, unknown> = {
    message,
    sender_id: "ThriveVas",
    msisdn: normalizedPhone,
  };

  // Include sender ID if configured
  if (config.shortCode) {
    body.sender_id = config.shortCode;
  }

  console.log("[ThriveVas] Sending SMS:", {
    url,
    to: normalizedPhone,
    from: config.shortCode || "(none)",
    messageLength: message.length
  });

  try {
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }, 2, 1000, 15000);

    const text = await response.text();
    let data: ThriveVasSmsResponse;
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: response.ok ? 200 : response.status, message: text };
    }

    console.log("[ThriveVas] Response:", { status: response.status, data });

    // ThriveVas returns status 200 on success with transaction_id
    if (response.ok && data.status === 200) {
      return {
        ok: true,
        stub: false,
        providerId: String(data.transaction_id),
      };
    }

    // Handle specific error codes
    const errorMsg = data.message ?? `HTTP ${response.status}`;
    console.error("[ThriveVas] SMS send failed:", { phone: normalizedPhone, error: errorMsg, response: data });
    return {
      ok: false,
      stub: false,
      error: errorMsg,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[ThriveVas] SMS send exception:", { phone: normalizedPhone, error: errorMsg });
    return {
      ok: false,
      stub: false,
      error: errorMsg,
    };
  }
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
