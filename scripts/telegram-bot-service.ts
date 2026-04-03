import "dotenv/config";
import { createServer } from "node:http";
import { URL } from "node:url";
import { getOptionalAppBaseUrl, getRequiredEnv } from "@/lib/env";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
const TELEGRAM_BOT_PORT = Number(process.env.TELEGRAM_BOT_PORT || 8001);
const APP_BASE_URL = getOptionalAppBaseUrl();

let updateOffset = 0;

type SendBulkPayload = {
  telegram_ids?: string[];
  text?: string;
  image_url?: string | null;
};

function jsonResponse(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function telegramRequest(method: string, body: BodyInit) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      body,
    },
  );

  const json = (await response.json()) as { ok: boolean; description?: string };

  if (!response.ok || !json.ok) {
    throw new Error(json.description || `Telegram API error at ${method}`);
  }

  return json;
}

async function sendText(chatId: string, text: string) {
  const body = new URLSearchParams({
    chat_id: chatId,
    text,
  });

  await telegramRequest("sendMessage", body);
}

async function sendPhoto(chatId: string, text: string, imageUrl: string) {
  if (!APP_BASE_URL && imageUrl.startsWith("/")) {
    throw new Error("APP_BASE_URL or NEXT_PUBLIC_APP_URL is required for local image uploads.");
  }

  const resolvedUrl =
    imageUrl.startsWith("http://") || imageUrl.startsWith("https://")
      ? imageUrl
      : new URL(imageUrl, APP_BASE_URL!).toString();

  const shouldUpload =
    imageUrl.startsWith("/") ||
    resolvedUrl.startsWith("http://127.0.0.1") ||
    resolvedUrl.startsWith("http://localhost");

  if (!shouldUpload) {
    const body = new URLSearchParams({
      chat_id: chatId,
      photo: resolvedUrl,
      caption: text,
    });

    await telegramRequest("sendPhoto", body);
    return;
  }

  const fileResponse = await fetch(resolvedUrl);

  if (!fileResponse.ok) {
    throw new Error("Не удалось скачать изображение для Telegram.");
  }

  const contentType = fileResponse.headers.get("content-type") || "image/jpeg";
  const extension = contentType.includes("png") ? "png" : "jpg";
  const blob = await fileResponse.blob();
  const formData = new FormData();

  formData.set("chat_id", chatId);
  formData.set("caption", text);
  formData.set("photo", new File([blob], `mailing.${extension}`, { type: contentType }));

  await telegramRequest("sendPhoto", formData);
}

async function processBulkSend(payload: SendBulkPayload) {
  const telegramIds = Array.isArray(payload.telegram_ids) ? payload.telegram_ids : [];
  const text = String(payload.text || "").trim();
  const imageUrl = payload.image_url ? String(payload.image_url).trim() : null;

  if (!text || telegramIds.length === 0) {
    throw new Error("Payload must include telegram_ids and text.");
  }

  let sent = 0;
  let failed = 0;

  for (const telegramId of telegramIds) {
    try {
      if (imageUrl) {
        await sendPhoto(telegramId, text, imageUrl);
      } else {
        await sendText(telegramId, text);
      }
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(`[telegram-bot-service] Failed to send to ${telegramId}:`, error);
    }
  }

  return { ok: true, sent, failed };
}

async function confirmLink(code: string, telegramId: string, telegramUsername?: string) {
  if (!APP_BASE_URL) {
    throw new Error("APP_BASE_URL or NEXT_PUBLIC_APP_URL is required.");
  }

  const response = await fetch(`${APP_BASE_URL}/api/telegram/link/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      telegramId,
      telegramUsername,
      secret: getRequiredEnv("TELEGRAM_LINK_SECRET"),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Link confirm failed");
  }
}

async function handleUpdate(update: {
  update_id: number;
  message?: {
    text?: string;
    chat?: { id: number };
    from?: { username?: string };
  };
}) {
  if (!update.message?.text || !update.message.chat?.id) {
    return;
  }

  const text = update.message.text.trim();
  const chatId = String(update.message.chat.id);
  const username = update.message.from?.username;

  if (text === "/start") {
    await sendText(
      chatId,
      "Привет! Чтобы привязать Telegram к аккаунту, получи код на сайте и отправь команду /link КОД.",
    );
    return;
  }

  if (!text.startsWith("/link")) {
    return;
  }

  const code = text.replace("/link", "").trim().toUpperCase();

  if (!code) {
    await sendText(chatId, "Нужен код привязки. Пример: /link ABC123");
    return;
  }

  try {
    await confirmLink(code, chatId, username);
    await sendText(chatId, "Telegram успешно привязан к вашему аккаунту.");
  } catch (error) {
    await sendText(
      chatId,
      error instanceof Error
        ? `Не удалось привязать Telegram: ${error.message}`
        : "Не удалось привязать Telegram.",
    );
  }
}

async function pollUpdates() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("[telegram-bot-service] TELEGRAM_BOT_TOKEN is missing. Polling skipped.");
    return;
  }

  for (;;) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?timeout=30&offset=${updateOffset}`,
      );
      const payload = (await response.json()) as {
        ok: boolean;
        result?: Array<{
          update_id: number;
          message?: {
            text?: string;
            chat?: { id: number };
            from?: { username?: string };
          };
        }>;
      };

      if (!payload.ok || !payload.result) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }

      for (const update of payload.result) {
        updateOffset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (error) {
      console.error("[telegram-bot-service] Polling error:", error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    jsonResponse(res, 404, { ok: false });
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${TELEGRAM_BOT_PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    jsonResponse(res, 200, { ok: true });
    return;
  }

  if (req.method !== "POST" || url.pathname !== "/send-bulk") {
    jsonResponse(res, 404, { ok: false, error: "not_found" });
    return;
  }

  const telegramBotApiSecret = getRequiredEnv("TELEGRAM_BOT_API_SECRET");

  if (req.headers["x-api-secret"] !== telegramBotApiSecret) {
    jsonResponse(res, 401, { ok: false, error: "forbidden" });
    return;
  }

  const chunks: Buffer[] = [];

  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", async () => {
    try {
      const raw = Buffer.concat(chunks).toString("utf-8");
      const payload = raw ? (JSON.parse(raw) as SendBulkPayload) : {};
      const result = await processBulkSend(payload);
      jsonResponse(res, 200, result);
    } catch (error) {
      jsonResponse(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "internal_error",
      });
    }
  });
});

server.listen(TELEGRAM_BOT_PORT, "0.0.0.0", () => {
  console.log(`[telegram-bot-service] listening on :${TELEGRAM_BOT_PORT}`);
});

void pollUpdates();
