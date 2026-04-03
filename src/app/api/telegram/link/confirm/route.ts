import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getTelegramLinkSecret } from "@/modules/telegram/server/service";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const code = String(body.code || "").trim().toUpperCase();
  const telegramId = String(body.telegramId || "").trim();
  const telegramUsername = body.telegramUsername
    ? String(body.telegramUsername).trim()
    : null;
  const secret = String(body.secret || "").trim();

  if (!code || !telegramId || !secret) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const rateLimit = consumeRateLimit({
    key: `telegram-link-confirm:${request.headers.get("x-forwarded-for") || telegramId}:${code}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  if (secret !== getTelegramLinkSecret()) {
    return NextResponse.json({ error: "forbidden" }, { status: 401 });
  }

  const linkCode = await prisma.telegramLinkCode.findFirst({
    where: {
      code,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!linkCode) {
    return NextResponse.json({ error: "code_not_found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.telegramConnection.deleteMany({
      where: {
        telegramChatId: telegramId,
        NOT: {
          userId: linkCode.userId,
        },
      },
    });

    await tx.telegramConnection.upsert({
      where: {
        userId: linkCode.userId,
      },
      update: {
        telegramChatId: telegramId,
        telegramUsername,
        isVerified: true,
      },
      create: {
        userId: linkCode.userId,
        telegramChatId: telegramId,
        telegramUsername,
        isVerified: true,
      },
    });

    await tx.telegramLinkCode.update({
      where: {
        id: linkCode.id,
      },
      data: {
        usedAt: new Date(),
      },
    });

    await tx.user.update({
      where: {
        id: linkCode.userId,
      },
      data: {
        telegramEnabled: true,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
