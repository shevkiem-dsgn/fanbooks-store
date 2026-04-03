import { NextRequest, NextResponse } from "next/server";
import { getRequiredEnv } from "@/lib/env";

const VK_CALLBACK_CONFIRMATION_TOKEN =
  process.env.VK_CALLBACK_CONFIRMATION_TOKEN?.trim() || null;

type VkCallbackPayload = {
  type?: string;
  secret?: string;
  object?: {
    message?: {
      text?: string;
      from_id?: number;
    };
  };
};

function plainText(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function POST(request: NextRequest) {
  const vkCallbackSecret = getRequiredEnv("VK_CALLBACK_SECRET");
  const body = (await request.json()) as VkCallbackPayload;

  if (!body.type) {
    return plainText("bad request", 400);
  }

  if (body.type === "confirmation") {
    if (!VK_CALLBACK_CONFIRMATION_TOKEN) {
      return plainText("VK_CALLBACK_CONFIRMATION_TOKEN is not configured", 500);
    }

    return plainText(VK_CALLBACK_CONFIRMATION_TOKEN);
  }

  if (body.secret !== vkCallbackSecret) {
    return plainText("forbidden", 403);
  }

  if (body.type === "message_new") {
    return plainText("ok");
  }

  return plainText("ok");
}
