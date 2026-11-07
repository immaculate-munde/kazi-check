import { NextResponse } from "next/server";
import { checkIpRateLimit, hashClientIp, rateLimitHeaders } from "@/lib/http/rate-limit";
import { createHash } from "crypto";
import { isTelegramConfigured } from "@/lib/telegram/client";
import {
  handleTelegramMessage,
  type TelegramUserMessage,
} from "@/lib/telegram/handlers";

export const instant = false;

type TelegramPhotoSize = { file_id: string; file_size?: number };
type TelegramDocument = {
  file_id: string;
  file_name?: string;
  file_size?: number;
};
type TelegramMessage = {
  message_id: number;
  chat: { id: number };
  from?: { id: number };
  text?: string;
  caption?: string;
  document?: TelegramDocument;
  photo?: TelegramPhotoSize[];
};
type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

function verifySecret(request: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!expected) {
    // Require secret in all environments so the route is not world-writable.
    return false;
  }
  const header = request.headers.get("x-telegram-bot-api-secret-token");
  if (header && header === expected) return true;
  const url = new URL(request.url);
  const query = url.searchParams.get("secret");
  return query === expected;
}

function chatRateKey(chatId: number): string {
  return createHash("sha256").update(`tg:${chatId}`).digest("hex").slice(0, 32);
}

function toUserMessage(message: TelegramMessage): TelegramUserMessage {
  const photos = message.photo ?? [];
  const largest = photos.length
    ? photos.reduce((a, b) => ((a.file_size ?? 0) >= (b.file_size ?? 0) ? a : b))
    : undefined;

  return {
    chatId: message.chat.id,
    telegramUserId: message.from?.id,
    text: message.text,
    caption: message.caption,
    document: message.document
      ? {
          file_id: message.document.file_id,
          file_name: message.document.file_name,
          file_size: message.document.file_size,
        }
      : undefined,
    photoFileId: largest?.file_id,
  };
}

export async function POST(request: Request) {
  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { error: "Telegram bot is not configured" },
      { status: 503 },
    );
  }

  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ipLimit = checkIpRateLimit(hashClientIp(request));
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(ipLimit.retryAfterSec) },
    );
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = update.message;
  if (!message?.chat?.id) {
    // Ignore non-message updates (edited_message, etc.)
    return NextResponse.json({ ok: true });
  }

  const chatLimit = checkIpRateLimit(chatRateKey(message.chat.id), Date.now(), 40);
  if (!chatLimit.ok) {
    return NextResponse.json(
      { error: "Too many messages from this chat" },
      { status: 429, headers: rateLimitHeaders(chatLimit.retryAfterSec) },
    );
  }

  try {
    await handleTelegramMessage(toUserMessage(message));
  } catch (err) {
    console.error("[telegram webhook]", err);
    // Still 200 so Telegram does not retry forever on handler bugs.
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    service: "kazi-check-telegram-webhook",
    configured: isTelegramConfigured(),
  });
}
