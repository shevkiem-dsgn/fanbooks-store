import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { getOptionalAppBaseUrl, getRequiredEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const TELEGRAM_BOT_API_URL =
  process.env.TELEGRAM_BOT_API_URL?.trim() || "http://127.0.0.1:8001";
export const APP_BASE_URL = getOptionalAppBaseUrl();

export type MailingTarget =
  | "all"
  | "release"
  | "product"
  | "release-final-unpaid"
  | "release-delivery-unpaid";

export type MailingChannel = "telegram" | "vk" | "both";

type MailingPayload = {
  telegramIds: string[];
  text: string;
  imageUrl?: string | null;
};

function getUploadsDir() {
  return path.join(process.cwd(), "public", "uploads", "mailings");
}

export async function saveTelegramMailingImage(file: File) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Можно прикрепить только изображение.");
  }

  await mkdir(getUploadsDir(), { recursive: true });

  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : ".jpg";
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const filePath = path.join(getUploadsDir(), fileName);
  const bytes = await file.arrayBuffer();

  await writeFile(filePath, Buffer.from(bytes));

  return `/uploads/mailings/${fileName}`;
}

export async function resolveTelegramRecipients(
  target: MailingTarget,
  releaseId: string,
  productId: string,
) {
  const where: Prisma.TelegramConnectionWhereInput = {
    isVerified: true,
    telegramChatId: {
      not: null,
    },
  };

  if (target === "release") {
    where.user = {
      orders: {
        some: {
          items: {
            some: {
              product: {
                releaseId,
              },
            },
          },
        },
      },
    };
  }

  if (target === "product") {
    where.user = {
      orders: {
        some: {
          items: {
            some: {
              productId,
            },
          },
        },
      },
    };
  }

  if (target === "release-final-unpaid") {
    where.user = {
      orders: {
        some: {
          preorderPaid: true,
          finalPaid: false,
          items: {
            some: {
              product: {
                releaseId,
              },
            },
          },
        },
      },
    };
  }

  if (target === "release-delivery-unpaid") {
    where.user = {
      orders: {
        some: {
          finalPaid: true,
          deliveryPaid: false,
          items: {
            some: {
              product: {
                releaseId,
              },
            },
          },
        },
      },
    };
  }

  const connections = await prisma.telegramConnection.findMany({
    where,
    select: {
      telegramChatId: true,
    },
  });

  return Array.from(
    new Set(
      connections
        .map((item) => item.telegramChatId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
}

export async function resolveVkRecipients(
  target: MailingTarget,
  releaseId: string,
  productId: string,
) {
  const where: Prisma.VkConnectionWhereInput = {
    isVerified: true,
    vkUserId: {
      not: null,
    },
  };

  if (target === "release") {
    where.user = {
      orders: {
        some: {
          items: {
            some: {
              product: {
                releaseId,
              },
            },
          },
        },
      },
    };
  }

  if (target === "product") {
    where.user = {
      orders: {
        some: {
          items: {
            some: {
              productId,
            },
          },
        },
      },
    };
  }

  if (target === "release-final-unpaid") {
    where.user = {
      orders: {
        some: {
          preorderPaid: true,
          finalPaid: false,
          items: {
            some: {
              product: {
                releaseId,
              },
            },
          },
        },
      },
    };
  }

  if (target === "release-delivery-unpaid") {
    where.user = {
      orders: {
        some: {
          finalPaid: true,
          deliveryPaid: false,
          items: {
            some: {
              product: {
                releaseId,
              },
            },
          },
        },
      },
    };
  }

  const connections = await prisma.vkConnection.findMany({
    where,
    select: {
      vkUserId: true,
    },
  });

  return Array.from(
    new Set(
      connections
        .map((item) => item.vkUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
}

export async function sendTelegramMailingToBot({
  telegramIds,
  text,
  imageUrl,
}: MailingPayload) {
  const telegramBotApiSecret = getRequiredEnv("TELEGRAM_BOT_API_SECRET");

  const response = await fetch(`${TELEGRAM_BOT_API_URL}/send-bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-secret": telegramBotApiSecret,
    },
    body: JSON.stringify({
      telegram_ids: telegramIds,
      text,
      image_url: imageUrl || null,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Bot API error");
  }

  return response.json() as Promise<{
    ok: boolean;
    sent?: number;
    failed?: number;
  }>;
}

export function getTelegramLinkSecret() {
  return getRequiredEnv("TELEGRAM_LINK_SECRET");
}

export async function getTelegramMailings(limit = 20) {
  return prisma.telegramMailing.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      release: {
        select: {
          id: true,
          title: true,
        },
      },
      product: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}
