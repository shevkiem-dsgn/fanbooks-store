import "dotenv/config";
import { confirmVkLink, getVkGroupId, getVkLongPollServer, sendVkMessage } from "@/modules/vk/server/service";

type VkLongPollResponse = {
  ts: string;
  updates: Array<{
    type: string;
    object?: {
      message?: {
        text?: string;
        from_id?: number;
      };
    };
  }>;
};

let currentServer = "";
let currentKey = "";
let currentTs = "";

async function ensureLongPollConfig() {
  const config = await getVkLongPollServer();
  currentServer = config.server;
  currentKey = config.key;
  currentTs = config.ts;
}

async function handleMessage(text: string, fromId: number) {
  const trimmed = text.trim();

  if (trimmed.toLowerCase() === "start") {
    await sendVkMessage(
      fromId,
      "Привет! Чтобы привязать VK к аккаунту, получите код на сайте и отправьте сообщение: link КОД",
    );
    return;
  }

  if (!trimmed.toLowerCase().startsWith("link")) {
    return;
  }

  const code = trimmed.slice(4).trim().toUpperCase();

  if (!code) {
    await sendVkMessage(fromId, "Нужен код привязки. Пример: link ABC123");
    return;
  }

  try {
    await confirmVkLink(code, String(fromId));
    await sendVkMessage(fromId, "VK успешно привязан к вашему аккаунту.");
  } catch (error) {
    await sendVkMessage(
      fromId,
      error instanceof Error
        ? `Не удалось привязать VK: ${error.message}`
        : "Не удалось привязать VK.",
    );
  }
}

async function processUpdates() {
  for (;;) {
    try {
      if (!currentServer || !currentKey || !currentTs) {
        await ensureLongPollConfig();
      }

      const url = new URL(currentServer);
      url.searchParams.set("act", "a_check");
      url.searchParams.set("key", currentKey);
      url.searchParams.set("ts", currentTs);
      url.searchParams.set("wait", "25");

      const response = await fetch(url.toString());
      const payload = (await response.json()) as VkLongPollResponse & { failed?: number };

      if (payload.failed) {
        await ensureLongPollConfig();
        continue;
      }

      currentTs = payload.ts;

      for (const update of payload.updates || []) {
        if (update.type !== "message_new") {
          continue;
        }

        const text = update.object?.message?.text;
        const fromId = update.object?.message?.from_id;

        if (!text || !fromId) {
          continue;
        }

        await handleMessage(text, fromId);
      }
    } catch (error) {
      console.error("[vk-bot-service] Polling error:", error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

const vkGroupId = getVkGroupId();

console.log(`[vk-bot-service] listening to group ${vkGroupId}`);
void processUpdates();
