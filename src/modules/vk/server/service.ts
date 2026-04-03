import { getOptionalAppBaseUrl, getRequiredEnv } from "@/lib/env";

export const VK_API_VERSION = process.env.VK_API_VERSION || "5.199";
export const APP_BASE_URL = getOptionalAppBaseUrl();

type VkApiResponse<T> = {
  response?: T;
  error?: {
    error_code: number;
    error_msg: string;
  };
};

type LongPollServerResponse = {
  key: string;
  server: string;
  ts: string;
};

export async function callVkApi<T>(
  method: string,
  params: Record<string, string | number>,
) {
  const vkGroupToken = getRequiredEnv("VK_GROUP_TOKEN");

  const body = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ),
    access_token: vkGroupToken,
    v: VK_API_VERSION,
  });

  const response = await fetch(`https://api.vk.com/method/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await response.json()) as VkApiResponse<T>;

  if (!response.ok || json.error || !json.response) {
    throw new Error(json.error?.error_msg || `VK API error at ${method}`);
  }

  return json.response;
}

export async function getVkLongPollServer() {
  const vkGroupId = getRequiredEnv("VK_GROUP_ID");

  return callVkApi<LongPollServerResponse>("groups.getLongPollServer", {
    group_id: vkGroupId,
  });
}

export async function sendVkMessage(userId: string | number, message: string) {
  return callVkApi("messages.send", {
    user_id: userId,
    random_id: Date.now(),
    message,
  });
}

export async function sendVkBulkMessages(vkUserIds: string[], message: string) {
  let sent = 0;
  let failed = 0;

  for (const vkUserId of vkUserIds) {
    try {
      await sendVkMessage(vkUserId, message);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(`[vk-mailing] Failed to send to ${vkUserId}:`, error);
    }
  }

  return {
    ok: true,
    sent,
    failed,
  };
}

export async function confirmVkLink(
  code: string,
  vkUserId: string,
  vkUsername?: string,
) {
  if (!APP_BASE_URL) {
    throw new Error("APP_BASE_URL or NEXT_PUBLIC_APP_URL is required.");
  }

  const response = await fetch(`${APP_BASE_URL}/api/vk/link/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      vkUserId,
      vkUsername,
      secret: getRequiredEnv("VK_LINK_SECRET"),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "VK link confirm failed");
  }
}

export function getVkGroupId() {
  return getRequiredEnv("VK_GROUP_ID");
}

export function getVkLinkSecret() {
  return getRequiredEnv("VK_LINK_SECRET");
}
