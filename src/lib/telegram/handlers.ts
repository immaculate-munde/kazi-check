import {
  enforceBatchCap,
  parseBufferToAds,
  validateUpload,
} from "@/lib/bot/parse-upload";
import { processBatch } from "@/lib/bot/process";
import { UploadSource, type RawAd } from "@/lib/bot/source";
import { prepareApplicationPack } from "@/lib/fit/prepare";
import { canPrepareForCheck } from "@/lib/fit/score";
import { runCheckPipeline } from "@/lib/pipeline/run-check";
import { parseCvTextToProfile } from "@/lib/profile/parse-cv-text";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/profile/otp";
import {
  getUserByTelegramChat,
  linkTelegramToUser,
  saveProfile,
  upsertVerifiedUser,
} from "@/lib/profile/store";
import { profileIsUsable, emptyProfile } from "@/lib/profile/types";
import { getCheck } from "@/lib/store";
import type { CheckDirection, CheckRecord } from "@/lib/types";
import {
  sendDocument,
  sendMessage,
  getFileBuffer,
} from "@/lib/telegram/client";
import {
  applyHelpText,
  formatBatchReply,
  formatCheckReply,
  formatFitReply,
  helpText,
  wantsApplyHelp,
} from "@/lib/telegram/format";
import {
  directionFromSession,
  getSession,
  setSession,
} from "@/lib/telegram/session";

export type TelegramUserMessage = {
  chatId: number;
  telegramUserId?: number;
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

async function maybePreparePack(chatId: number, check: CheckRecord) {
  if (!canPrepareForCheck(check)) return;

  const user = await getUserByTelegramChat(chatId);
  if (!user || !profileIsUsable(user.profile)) {
    await sendMessage(
      chatId,
      "Want your match score and a tailored CV for this role?\nType /profile (phone + CV once), then /cv.",
    );
    return;
  }

  const pack = await prepareApplicationPack({
    check,
    userId: user.id,
    profile: user.profile!,
  });
  if ("blocked" in pack) {
    await sendMessage(chatId, pack.reason);
    return;
  }

  await sendMessage(chatId, formatFitReply(check, pack.fit));
  try {
    await sendDocument(
      chatId,
      pack.pdf,
      pack.fileName,
      "Download CV for this role — then open the official apply page yourself.",
    );
  } catch {
    await sendMessage(
      chatId,
      `I built your CV but could not attach the PDF. Open the report and download there.`,
    );
  }
}

async function replyCheck(
  chatId: number,
  direction: CheckDirection,
  text: string,
) {
  await sendMessage(chatId, "Checking this job message…");
  const check = await runCheckPipeline({ direction, text });
  setSession(chatId, "idle", { lastCheckId: check.id });
  await sendMessage(chatId, formatCheckReply(check));
  await maybePreparePack(chatId, check);
}

async function replyApply(chatId: number) {
  const { lastCheckId } = getSession(chatId);
  const check = lastCheckId ? await getCheck(lastCheckId) : null;
  await sendMessage(chatId, applyHelpText(check));
  if (check && canPrepareForCheck(check)) {
    await maybePreparePack(chatId, check);
  }
}

async function replyCv(chatId: number) {
  const { lastCheckId } = getSession(chatId);
  if (!lastCheckId) {
    await sendMessage(chatId, "Check a job first (/check), then type /cv.");
    return;
  }
  const check = await getCheck(lastCheckId);
  if (!check) {
    await sendMessage(chatId, "I could not find your last check. Paste a job ad again.");
    return;
  }
  await maybePreparePack(chatId, check);
}

async function startProfileFlow(chatId: number) {
  const existing = await getUserByTelegramChat(chatId);
  if (existing && profileIsUsable(existing.profile)) {
    await sendMessage(
      chatId,
      `Profile linked to ${existing.phone}.\nName: ${existing.profile?.fullName || "—"}\nSkills: ${(existing.profile?.skills ?? []).slice(0, 8).join(", ") || "—"}\n\nSend a new CV as text to update, or paste a job to check.\nWebsite: also edit at /profile on the site.`,
    );
    setSession(chatId, "awaiting_cv_text", { pendingUserId: existing.id });
    return;
  }
  setSession(chatId, "awaiting_phone");
  await sendMessage(
    chatId,
    "Let's set up your profile (once).\nSend your Kenyan phone number (07… or +254…). We'll SMS a code.",
  );
}

async function handleOnboardingText(
  chatId: number,
  text: string,
  telegramUserId?: number,
): Promise<boolean> {
  const session = getSession(chatId);

  if (session.step === "awaiting_phone") {
    const req = await requestPhoneOtp(text);
    if (!req.ok) {
      await sendMessage(chatId, req.error);
      return true;
    }
    setSession(chatId, "awaiting_otp", { pendingPhone: req.phone });
    await sendMessage(
      chatId,
      req.stubCode
        ? `Dev mode — your code is ${req.stubCode}. Reply with that 6-digit code.`
        : "Code sent by SMS. Reply with the 6-digit code.",
    );
    return true;
  }

  if (session.step === "awaiting_otp") {
    const phone = session.pendingPhone;
    if (!phone) {
      setSession(chatId, "awaiting_phone");
      await sendMessage(chatId, "Send your phone number again.");
      return true;
    }
    const verified = await verifyPhoneOtp(phone, text);
    if (!verified.ok) {
      await sendMessage(chatId, verified.error);
      return true;
    }
    const user = await upsertVerifiedUser(verified.phone);
    await linkTelegramToUser(user.id, chatId, telegramUserId);
    setSession(chatId, "awaiting_name", { pendingUserId: user.id });
    await sendMessage(
      chatId,
      "Phone verified. What's your full name? (or paste your whole CV text now)",
    );
    return true;
  }

  if (session.step === "awaiting_name") {
    const userId = session.pendingUserId;
    if (!userId) {
      setSession(chatId, "idle");
      return false;
    }
    if (text.length > 120 || /\n/.test(text)) {
      const profile = parseCvTextToProfile(text);
      if (!profile.fullName) profile.fullName = text.split("\n")[0]?.slice(0, 80) ?? "";
      await saveProfile(userId, profile);
      setSession(chatId, "idle", { pendingUserId: userId });
      await sendMessage(
        chatId,
        "Profile saved from your CV text. Paste a job ad anytime — I'll score your fit and send a tailored PDF when it's safe.",
      );
      return true;
    }
    const profile = emptyProfile("telegram_qa");
    profile.fullName = text.slice(0, 80);
    await saveProfile(userId, profile);
    setSession(chatId, "awaiting_cv_text", { pendingUserId: userId });
    await sendMessage(
      chatId,
      "Thanks. Now paste your CV / experience as text (skills, jobs, education). Or send a .txt / PDF.",
    );
    return true;
  }

  if (session.step === "awaiting_cv_text") {
    const userId = session.pendingUserId;
    if (!userId) {
      setSession(chatId, "idle");
      return false;
    }
    const profile = parseCvTextToProfile(text);
    if (!profile.fullName) {
      const prior = await getUserByTelegramChat(chatId);
      profile.fullName = prior?.profile?.fullName || profile.fullName;
    }
    await saveProfile(userId, { ...profile, source: "mixed" });
    setSession(chatId, "idle", { pendingUserId: userId });
    await sendMessage(
      chatId,
      "Profile updated. Paste a job ad to check — if it's not a scam, I'll send your match score and tailored CV.",
    );
    return true;
  }

  return false;
}

async function replyBatch(chatId: number, ads: RawAd[]) {
  if (ads.length === 0) {
    await sendMessage(
      chatId,
      "I couldn't find job text there. Paste the advert, or send a photo / PDF / .txt file.",
    );
    return;
  }
  await sendMessage(
    chatId,
    ads.length === 1
      ? "Checking this upload…"
      : `Checking ${ads.length} jobs from your upload…`,
  );
  const capped = enforceBatchCap(ads);
  const source = new UploadSource(capped.ads);
  const batch = await source.fetch_ads();
  const items = await processBatch(batch);
  const firstCheck = items.find((i) => i.checkId)?.checkId;
  setSession(chatId, "idle", firstCheck ? { lastCheckId: firstCheck } : {});
  let body = formatBatchReply(items);
  if (capped.truncated) {
    body = `I only checked the first batch (limit reached).\n\n${body}`;
  }
  await sendMessage(chatId, body);
  if (firstCheck) {
    const check = await getCheck(firstCheck);
    if (check) await maybePreparePack(chatId, check);
  }
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
  const session = getSession(chatId);
  const { buffer, fileName } = await getFileBuffer(fileId);
  const name = suggestedName.includes(".")
    ? suggestedName
    : guessFilenameFromPath(
        fileName,
        suggestedName.includes("photo") ? "jpg" : "bin",
      );

  if (session.step === "awaiting_cv_text" || session.step === "awaiting_name") {
    const userId = session.pendingUserId;
    if (!userId) {
      setSession(chatId, "idle");
      return;
    }
    const invalid = validateUpload(name, buffer.length);
    if (invalid) {
      await sendMessage(
        chatId,
        "That file type or size isn't supported for profile upload. Use PDF / .txt under 5MB, or paste text.",
      );
      return;
    }
    const parsed = await parseBufferToAds(name, buffer);
    const text =
      parsed.ads.map((a) => a.text).join("\n\n") ||
      buffer.toString("utf8").slice(0, 20000);
    const profile = parseCvTextToProfile(text);
    await saveProfile(userId, profile);
    setSession(chatId, "idle", { pendingUserId: userId });
    await sendMessage(
      chatId,
      "Profile saved from your file. Paste a job ad when you're ready.",
    );
    return;
  }

  const invalid = validateUpload(name, buffer.length);
  if (invalid) {
    await sendMessage(
      chatId,
      "That file type or size isn't supported. Use a photo, PDF, .txt, or .csv under 5MB.",
    );
    return;
  }

  const ads: RawAd[] = [];
  const captionText = caption?.trim();
  if (captionText) {
    ads.push({ sourceType: "paste", text: captionText });
  }

  const parsed = await parseBufferToAds(name, buffer);
  if (parsed.error) {
    await sendMessage(chatId, `I couldn't read that file. ${parsed.error}`);
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

  if (cmd === "/profile") {
    await startProfileFlow(chatId);
    return;
  }

  if (cmd === "/cv") {
    await replyCv(chatId);
    return;
  }

  if (cmd === "/check") {
    setSession(chatId, "awaiting_offer");
    await sendMessage(
      chatId,
      "Send the job advert now — paste the text, or upload a photo / PDF / .txt file.",
    );
    return;
  }

  if (cmd === "/applicant") {
    setSession(chatId, "awaiting_applicant");
    await sendMessage(
      chatId,
      "Paste the applicant message or claims you want checked.",
    );
    return;
  }

  if (cmd === "/apply") {
    await replyApply(chatId);
    return;
  }

  if (msg.document) {
    const name = msg.document.file_name || "upload.bin";
    if (msg.document.file_size && msg.document.file_size > 5 * 1024 * 1024) {
      await sendMessage(chatId, "That file is too big. Please keep it under 5MB.");
      return;
    }
    try {
      await handleUpload(chatId, msg.document.file_id, name, msg.caption);
    } catch {
      await sendMessage(
        chatId,
        "Sorry — I couldn't open that file. Try a clearer photo or a .txt paste.",
      );
    }
    return;
  }

  if (msg.photoFileId) {
    try {
      await handleUpload(chatId, msg.photoFileId, "photo.jpg", msg.caption);
    } catch {
      await sendMessage(
        chatId,
        "Sorry — I couldn't read that photo. Try again or paste the text instead.",
      );
    }
    return;
  }

  if (!text) {
    await sendMessage(
      chatId,
      "Send a job ad as text, a screenshot, or type /help.",
    );
    return;
  }

  if (cmd) {
    await sendMessage(
      chatId,
      "I don't know that command. Try /help, /check, /profile, /cv, /applicant, or /apply.",
    );
    return;
  }

  if (await handleOnboardingText(chatId, text, msg.telegramUserId)) {
    return;
  }

  if (wantsApplyHelp(text)) {
    await replyApply(chatId);
    return;
  }

  try {
    const direction = directionFromSession(chatId);
    await replyCheck(chatId, direction, text);
  } catch {
    setSession(chatId, "idle");
    await sendMessage(
      chatId,
      "Something went wrong while checking. Please try again in a moment.",
    );
  }
}
