"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";

function generateCode() {
  return randomBytes(3).toString("hex").toUpperCase();
}

export async function createTelegramLinkCodeAction() {
  await assertSameOriginRequest();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const rateLimit = consumeRateLimit({
    key: `telegram-link:${user.id}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    redirect("/account/telegram");
  }

  await prisma.telegramLinkCode.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  await prisma.telegramLinkCode.create({
    data: {
      userId: user.id,
      code: generateCode(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  redirect("/account/telegram");
}
