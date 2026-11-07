/**
 * Thin Telegram Bot API client (fetch only — no framework).
 * Docs: https://core.telegram.org/bots/api
 */

export function getTelegramToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token || null;
}

export function isTelegramConfigured(): boolean {
  return Boolean(getTelegramToken());
}

type TelegramApiResult<T> = {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
};

async function telegramApi<T>(
  method: string,
  body?: Record<string, unknown> | FormData,
): Promise<T> {
  const token = getTelegramToken();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const url = `https://api.telegram.org/bot${token}/${method}`;
  const response =
    body instanceof FormData
      ? await fetch(url, { method: "POST", body })
      : await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });

  const data = (await response.json()) as TelegramApiResult<T>;
  if (!data.ok || data.result === undefined) {
    throw new Error(data.description ?? `Telegram API ${method} failed`);
  }
  return data.result;
}

export async function sendMessage(
  chatId: number | string,
  text: string,
  opts: {
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    disable_web_page_preview?: boolean;
  } = {},
): Promise<unknown> {
  // Telegram max message length is 4096; keep a margin.
  const clipped = text.length > 4000 ? `${text.slice(0, 3990)}…` : text;
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text: clipped,
    disable_web_page_preview: opts.disable_web_page_preview ?? true,
    ...(opts.parse_mode ? { parse_mode: opts.parse_mode } : {}),
  });
}

type TelegramFile = {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
};

export async function sendDocument(
  chatId: number | string,
  file: Buffer,
  fileName: string,
  caption?: string,
): Promise<unknown> {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append(
    "document",
    new Blob([new Uint8Array(file)], { type: "application/pdf" }),
    fileName,
  );
  if (caption) {
    const clipped = caption.length > 900 ? `${caption.slice(0, 890)}…` : caption;
    form.append("caption", clipped);
  }
  return telegramApi("sendDocument", form);
}

export async function getFileBuffer(fileId: string): Promise<{
  buffer: Buffer;
  filePath: string;
  fileName: string;
}> {
  const file = await telegramApi<TelegramFile>("getFile", { file_id: fileId });
  if (!file.file_path) {
    throw new Error("Telegram getFile returned no file_path");
  }
  const token = getTelegramToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  const downloadUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`Failed to download Telegram file (${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const fileName = file.file_path.split("/").pop() || "upload.bin";
  return {
    buffer: Buffer.from(arrayBuffer),
    filePath: file.file_path,
    fileName,
  };
}
