import {
  enforceBatchCap,
  parseBufferToAds,
  validateUpload,
} from "@/lib/bot/parse-upload";
import { processBatch } from "@/lib/bot/process";
import { UploadSource, type RawAd } from "@/lib/bot/source";
import { runCheckPipeline } from "@/lib/pipeline/run-check";
import type { CheckDirection } from "@/lib/types";
import { sendMessage, getFileBuffer } from "@/lib/telegram/client";
import {
  formatBatchReply,
  formatCheckReply,
  helpText,
} from "@/lib/telegram/format";
import { getSession, setSession } from "@/lib/telegram/session";

export type TelegramUserMessage = {
  chatId: number;
  text?: string;
  caption?: string;
  document?: { file_id: string; file_name?: string; file_size?: number };
  /** Largest photo size file_id */
  photoFileId?: string;
};

function commandOf(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return null;
  const token = trimmed.split(/\s+/)[0] ?? "";
  return token.split("@")[0]?.toLowerCase() ?? null;
}

function directionFromSession(chatId: number): CheckDirection {
  const step = getSession(chatId).step;
  if (step === "awaiting_applicant") return "applicant";
  return "job_offer";
}

async function replyCheck(
  chatId: number,
  direction: CheckDirection,
  text: string,
) {
  await sendMessage(chatId, "Checking…");
  const check = await runCheckPipeline({ direction, text });
  setSession(chatId, "idle");
  await sendMessage(chatId, formatCheckReply(check));
}

async function replyBatch(chatId: number, ads: RawAd[]) {
  if (ads.length === 0) {
    await sendMessage(
      chatId,
      "No job text found. Paste an advert or upload .txt / .csv / .pdf / photo.",
    );
    return;
  }
  await sendMessage(chatId, `Processing ${ads.length} ad(s)…`);
  const capped = enforceBatchCap(ads);
  const source = new UploadSource(capped.ads);
  const batch = await source.fetch_ads();
  const items = await processBatch(batch);
  setSession(chatId, "idle");
  let body = formatBatchReply(items);
  if (capped.truncated) {
    body = `Batch capped — some ads were skipped.\n\n${body}`;
  }
  await sendMessage(chatId, body);
}

function guessFilenameFromPath(name: string, fallbackExt: string): string {
  const base = name.split(/[/\\]/).pop() || name;
  if (base.includes(".")) return base;
  return `${base}.${fallbackExt}`;
}

async function handleUpload(
  chatId: number,
  fileId: string,
  suggestedName: string,
  caption?: string,
) {
  const { buffer, fileName } = await getFileBuffer(fileId);
  const name = suggestedName.includes(".")
    ? suggestedName
    : guessFilenameFromPath(fileName, suggestedName.includes("photo") ? "jpg" : "bin");

  const invalid = validateUpload(name, buffer.length);
  if (invalid) {
    await sendMessage(chatId, invalid);
    return;
  }

  const ads: RawAd[] = [];
  const captionText = caption?.trim();
  if (captionText) {
    ads.push({ sourceType: "paste", text: captionText });
  }

  const parsed = await parseBufferToAds(name, buffer);
  if (parsed.error) {
    await sendMessage(chatId, `${name}: ${parsed.error}`);
    if (ads.length === 0) return;
  } else {
    ads.push(...parsed.ads);
  }

  await replyBatch(chatId, ads);
}

export async function handleTelegramMessage(
  msg: TelegramUserMessage,
): Promise<void> {
  const { chatId } = msg;
  const text = (msg.text ?? "").trim();
  const cmd = text ? commandOf(text) : null;

  if (cmd === "/start" || cmd === "/help") {
    setSession(chatId, "idle");
    await sendMessage(chatId, helpText());
    return;
  }

  if (cmd === "/check") {
    setSession(chatId, "awaiting_offer");
    await sendMessage(
      chatId,
      "Send the job advert as text, or upload a .txt / .csv / .pdf / photo.",
    );
    return;
  }

  if (cmd === "/applicant") {
    setSession(chatId, "awaiting_applicant");
    await sendMessage(
      chatId,
      "Paste the applicant claim, CV summary, or outreach message.",
    );
    return;
  }

  if (msg.document) {
    const name = msg.document.file_name || "upload.bin";
    if (msg.document.file_size && msg.document.file_size > 5 * 1024 * 1024) {
      await sendMessage(chatId, "File exceeds 5MB limit.");
      return;
    }
    try {
      await handleUpload(chatId, msg.document.file_id, name, msg.caption);
    } catch (err) {
      await sendMessage(
        chatId,
        err instanceof Error ? err.message : "Could not process that file.",
      );
    }
    return;
  }

  if (msg.photoFileId) {
    try {
      await handleUpload(
        chatId,
        msg.photoFileId,
        "photo.jpg",
        msg.caption,
      );
    } catch (err) {
      await sendMessage(
        chatId,
        err instanceof Error ? err.message : "Could not process that photo.",
      );
    }
    return;
  }

  if (!text) {
    await sendMessage(
      chatId,
      "Send job ad text, /check, /applicant, or upload a file. /help for menu.",
    );
    return;
  }

  if (cmd) {
    await sendMessage(chatId, "Unknown command. Try /help.");
    return;
  }

  try {
    const direction = directionFromSession(chatId);
    await replyCheck(chatId, direction, text);
  } catch (err) {
    setSession(chatId, "idle");
    await sendMessage(
      chatId,
      err instanceof Error ? err.message : "Check failed. Try again.",
    );
  }
}
