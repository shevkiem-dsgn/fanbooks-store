"use server";

import { requireAdmin } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { assertSameOriginRequest } from "@/lib/request-security";
import {
  type MailingChannel,
  resolveTelegramRecipients,
  resolveVkRecipients,
  saveTelegramMailingImage,
  sendTelegramMailingToBot,
  type MailingTarget,
} from "@/modules/telegram/server/service";
import { sendVkBulkMessages } from "@/modules/vk/server/service";

export type MailingFormState = {
  error?: string;
  success?: string;
};

export async function sendTelegramMailingAction(
  _prevState: MailingFormState,
  formData: FormData,
): Promise<MailingFormState> {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const target = String(formData.get("target") || "all") as MailingTarget;
  const channel = String(formData.get("channel") || "telegram") as MailingChannel;
  const releaseId = String(formData.get("releaseId") || "").trim();
  const productId = String(formData.get("productId") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const imageUrlInput = String(formData.get("imageUrl") || "").trim();
  const imageFile = formData.get("imageFile");

  if (!text) {
    return { error: "Введи текст сообщения." };
  }

  if (channel !== "telegram" && (imageUrlInput || (imageFile instanceof File && imageFile.size > 0))) {
    return {
      error: "Изображения пока поддерживаются только для Telegram-рассылок.",
    };
  }

  if (
    (target === "release" ||
      target === "release-final-unpaid" ||
      target === "release-delivery-unpaid") &&
    !releaseId
  ) {
    return { error: "Выбери релиз." };
  }

  if (target === "product" && !productId) {
    return { error: "Выбери товар." };
  }

  let savedImageUrl = imageUrlInput || null;

  try {
    if (imageFile instanceof File && imageFile.size > 0) {
      savedImageUrl = await saveTelegramMailingImage(imageFile);
    }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Не удалось сохранить изображение.",
    };
  }

  const [telegramIds, vkUserIds] = await Promise.all([
    channel === "telegram" || channel === "both"
      ? resolveTelegramRecipients(target, releaseId, productId)
      : Promise.resolve([]),
    channel === "vk" || channel === "both"
      ? resolveVkRecipients(target, releaseId, productId)
      : Promise.resolve([]),
  ]);

  const totalRecipients =
    (channel === "telegram" ? telegramIds.length : 0) +
    (channel === "vk" ? vkUserIds.length : 0) +
    (channel === "both" ? telegramIds.length + vkUserIds.length : 0);

  if (totalRecipients === 0) {
    return { error: "Не найдено ни одного получателя в выбранном канале." };
  }

  const mailing = await prisma.telegramMailing.create({
    data: {
      channel: channel.toUpperCase(),
      target,
      releaseId: releaseId || null,
      productId: productId || null,
      text,
      imageUrl: savedImageUrl,
      recipients: totalRecipients,
      status: "DRAFT",
    },
  });

  try {
    const [telegramResult, vkResult] = await Promise.all([
      channel === "telegram" || channel === "both"
        ? sendTelegramMailingToBot({
            telegramIds,
            text,
            imageUrl: savedImageUrl,
          })
        : Promise.resolve({ ok: true, sent: 0, failed: 0 }),
      channel === "vk" || channel === "both"
        ? sendVkBulkMessages(vkUserIds, text)
        : Promise.resolve({ ok: true, sent: 0, failed: 0 }),
    ]);

    const sentCount = (telegramResult.sent ?? 0) + (vkResult.sent ?? 0);
    const failedCount = (telegramResult.failed ?? 0) + (vkResult.failed ?? 0);

    await prisma.telegramMailing.update({
      where: {
        id: mailing.id,
      },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentCount,
        failedCount,
      },
    });

    await writeAdminAuditEvent({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "send_mailing",
      targetType: "mailing",
      targetId: mailing.id,
      metadata: {
        channel,
        target,
        totalRecipients,
      },
    });

    return {
      success: `Рассылка отправлена. Доставлено: ${sentCount}`,
    };
  } catch (error) {
    await prisma.telegramMailing.update({
      where: {
        id: mailing.id,
      },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Не удалось отправить рассылку.",
      },
    });

    return {
      error:
        error instanceof Error
          ? `Не удалось отправить рассылку: ${error.message}`
          : "Не удалось отправить рассылку.",
    };
  }
}
