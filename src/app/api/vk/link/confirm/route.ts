import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getVkLinkSecret } from "@/modules/vk/server/service";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const code = String(body.code || "").trim().toUpperCase();
  const vkUserId = String(body.vkUserId || "").trim();
  const vkUsername = body.vkUsername ? String(body.vkUsername).trim() : null;
  const secret = String(body.secret || "").trim();

  if (!code || !vkUserId || !secret) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const rateLimit = consumeRateLimit({
    key: `vk-link-confirm:${request.headers.get("x-forwarded-for") || vkUserId}:${code}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  if (secret !== getVkLinkSecret()) {
    return NextResponse.json({ error: "forbidden" }, { status: 401 });
  }

  const linkCode = await prisma.vkLinkCode.findFirst({
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
    await tx.vkConnection.deleteMany({
      where: {
        vkUserId,
        NOT: {
          userId: linkCode.userId,
        },
      },
    });

    await tx.vkConnection.upsert({
      where: {
        userId: linkCode.userId,
      },
      update: {
        vkUserId,
        vkUsername,
        isVerified: true,
      },
      create: {
        userId: linkCode.userId,
        vkUserId,
        vkUsername,
        isVerified: true,
      },
    });

    await tx.vkLinkCode.update({
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
        vkEnabled: true,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
