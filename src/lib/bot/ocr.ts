/**
 * Image/PDF extraction. OCR may fill text; it must never invent a phone number.
 * Unreadable fields become gaps.
 */

export type OcrResult = {
  text: string;
  unreadable: boolean;
  reason?: string;
  engine?: "tesseract" | "unpdf" | "pdf-strings" | "none";
};

const UNREADABLE_PHONE =
  "Phone number was unreadable — not guessed.";

export function extractImagePlaceholder(): OcrResult {
  return {
    text: "",
    unreadable: true,
    engine: "none",
    reason:
      "Could not read this screenshot. Phone numbers were not guessed. Paste the message text if OCR fails.",
  };
}

/** If the ad talks about a phone but none was read, that is a gap — not a guess. */
export function unreadablePhoneGap(text: string): string | null {
  const mentions =
    /phone|call|sms|whatsapp|telegram|nambari|mpesa|contact\s*(me|us|hr)|07\s*\d/i.test(
      text,
    );
  const hasPhone = /(?:\+?254|0)(7\d{8})\b/.test(text);
  if (mentions && !hasPhone) return UNREADABLE_PHONE;
  return null;
}

function pdfStringsFallback(buffer: Buffer): OcrResult {
  const raw = buffer.toString("latin1");
  const chunks: string[] = [];
  const paren = /\((?:\\.|[^\\)]){3,}\)/g;
  for (const m of raw.matchAll(paren)) {
    const inner = m[0].slice(1, -1).replace(/\\n/g, "\n").replace(/\\[()\\]/g, "");
    if (/[A-Za-z]{3,}/.test(inner)) chunks.push(inner);
  }
  const text = chunks.join("\n").replace(/\s+/g, " ").trim();
  if (text.length < 20) {
    return {
      text: "",
      unreadable: true,
      engine: "pdf-strings",
      reason: "Could not read text from this PDF. Phone numbers were not guessed.",
    };
  }
  return { text, unreadable: false, engine: "pdf-strings" };
}

export async function extractPdfText(buffer: Buffer): Promise<OcrResult> {
  try {
    const unpdf = await import("unpdf");
    const extracted = await unpdf.extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    const text = (Array.isArray(extracted.text) ? extracted.text.join("\n") : extracted.text)
      .replace(/\s+/g, " ")
      .trim();
    if (text.length >= 20) {
      return { text, unreadable: false, engine: "unpdf" };
    }
  } catch {
    // fall through
  }
  return pdfStringsFallback(buffer);
}

export async function extractImageText(buffer: Buffer): Promise<OcrResult> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    try {
      const result = await worker.recognize(buffer);
      const text = (result.data.text ?? "").replace(/\s+/g, " ").trim();
      if (text.length < 12) {
        return extractImagePlaceholder();
      }
      return { text, unreadable: false, engine: "tesseract" };
    } finally {
      await worker.terminate();
    }
  } catch {
    return extractImagePlaceholder();
  }
}
