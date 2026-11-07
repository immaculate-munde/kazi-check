import { NextResponse } from "next/server";
import { UploadSource } from "@/lib/bot/source";
import {
  enforceBatchCap,
  MAX_ADS_PER_BATCH,
  parseBufferToAds,
  validateUpload,
} from "@/lib/bot/parse-upload";
import { processBatch, queueTable } from "@/lib/bot/process";
import type { RawAd } from "@/lib/bot/source";

export const instant = false;

/**
 * Single or batch upload. Raw bytes are held only for this request,
 * then dropped — nothing is written to disk.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const ads: RawAd[] = [];
  const errors: { filename: string; reason: string }[] = [];

  const pasted = String(form.get("text") ?? "").trim();
  if (pasted) {
    ads.push({ sourceType: "paste", text: pasted });
  }

  const files = form.getAll("files");
  for (const entry of files) {
    if (!(entry instanceof File)) continue;
    const size = entry.size;
    const name = entry.name || "upload";
    const invalid = validateUpload(name, size);
    if (invalid) {
      errors.push({ filename: name, reason: invalid });
      continue;
    }
    try {
      const buf = Buffer.from(await entry.arrayBuffer());
      const parsed = await parseBufferToAds(name, buf);
      if (parsed.error) errors.push({ filename: name, reason: parsed.error });
      ads.push(...parsed.ads);
    } catch (err) {
      errors.push({
        filename: name,
        reason: err instanceof Error ? err.message : "Could not read file",
      });
    }
  }

  if (ads.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: "No ads accepted", errors }, { status: 400 });
  }
  if (ads.length === 0) {
    return NextResponse.json(
      { error: "Paste text or upload .txt, .csv, .pdf, or an image" },
      { status: 400 },
    );
  }

  const notifyPhone = String(form.get("phone") ?? "").trim() || undefined;
  const capped = enforceBatchCap(ads);
  const source = new UploadSource(capped.ads);
  const batch = await source.fetch_ads();
  const items = await processBatch(batch, { notifyPhone });

  return NextResponse.json({
    items,
    table: queueTable(items),
    errors,
    truncated: capped.truncated,
    maxBatch: MAX_ADS_PER_BATCH,
    rawFilesRetained: false,
  });
}
