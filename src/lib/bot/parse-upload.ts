import { extractImageText, extractPdfText, unreadablePhoneGap } from "@/lib/bot/ocr";
import type { RawAd } from "@/lib/bot/source";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ADS_PER_BATCH = 20;

const ALLOWED_EXT = new Set([
  "txt",
  "csv",
  "pdf",
  "png",
  "jpg",
  "jpeg",
]);

export type ParseError = { filename: string; reason: string };

export function fileExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function validateUpload(filename: string, size: number): string | null {
  const ext = fileExtension(filename);
  if (!ALLOWED_EXT.has(ext)) {
    return `Rejected type .${ext || "unknown"}. Use pasted text, .txt, .pdf, .png/.jpg/.jpeg, or .csv.`;
  }
  if (size > MAX_FILE_BYTES) {
    return `File exceeds ${MAX_FILE_BYTES / (1024 * 1024)}MB limit.`;
  }
  return null;
}

export function parseCsvAds(text: string, filename: string): RawAd[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const start =
    /^(ad|text|message|job|description)\b/i.test(lines[0]) && lines.length > 1 ? 1 : 0;
  return lines.slice(start).map((line) => ({
    sourceType: "csv" as const,
    filename,
    text: line.replace(/^"|"$/g, ""),
  }));
}

function withPhoneGap(ocr: {
  text: string;
  unreadable?: boolean;
  reason?: string;
}): { text: string; unreadable: boolean; unreadableReason?: string } {
  const phoneGap = unreadablePhoneGap(ocr.text);
  if (ocr.unreadable) {
    return {
      text: ocr.text,
      unreadable: true,
      unreadableReason: [ocr.reason, phoneGap].filter(Boolean).join(" "),
    };
  }
  return {
    text: ocr.text,
    unreadable: false,
    unreadableReason: phoneGap ?? undefined,
  };
}

export async function parseBufferToAds(
  filename: string,
  buffer: Buffer,
): Promise<{ ads: RawAd[]; error?: string }> {
  const ext = fileExtension(filename);
  if (ext === "txt") {
    const text = buffer.toString("utf8").trim();
    if (!text) return { ads: [], error: "Empty text file." };
    return { ads: [{ sourceType: "txt", filename, text }] };
  }
  if (ext === "csv") {
    const ads = parseCsvAds(buffer.toString("utf8"), filename);
    if (ads.length === 0) return { ads: [], error: "CSV had no ad rows." };
    return { ads };
  }
  if (ext === "pdf") {
    const ocr = withPhoneGap(await extractPdfText(buffer));
    return {
      ads: [
        {
          sourceType: "pdf",
          filename,
          text: ocr.text,
          unreadable: ocr.unreadable,
          unreadableReason: ocr.unreadableReason,
        },
      ],
    };
  }
  if (ext === "png" || ext === "jpg" || ext === "jpeg") {
    const ocr = withPhoneGap(await extractImageText(buffer));
    return {
      ads: [
        {
          sourceType: "image",
          filename,
          text: ocr.text,
          unreadable: ocr.unreadable,
          unreadableReason: ocr.unreadableReason,
        },
      ],
    };
  }
  return { ads: [], error: `Rejected type .${ext}` };
}

export function enforceBatchCap(ads: RawAd[]): { ads: RawAd[]; truncated: number } {
  if (ads.length <= MAX_ADS_PER_BATCH) return { ads, truncated: 0 };
  return {
    ads: ads.slice(0, MAX_ADS_PER_BATCH),
    truncated: ads.length - MAX_ADS_PER_BATCH,
  };
}
