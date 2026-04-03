"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";

function generateCode() {
  return randomBytes(3).toString("hex").toUpperCase();
}

export async function createVkLinkCodeAction() {
  await assertSameOriginRequest();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const rateLimit = consumeRateLimit({
    key: `vk-link:${user.id}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    redirect("/account/vk");
  }

  await prisma.vkLinkCode.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  await prisma.vkLinkCode.create({
    data: {
      userId: user.id,
      code: generateCode(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  redirect("/account/vk");
}
