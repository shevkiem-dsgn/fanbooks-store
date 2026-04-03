"use server";

import { requireAdmin } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { assertSameOriginRequest } from "@/lib/request-security";
import {
  generateReleaseDigest,
  generateReleaseForecast,
  generateReleaseMailingDraft,
} from "@/modules/ai/server/service";

export type AiToolState = {
  error?: string;
  result?: string;
};

export async function generateReleaseDigestAction(
  _prevState: AiToolState,
  formData: FormData,
): Promise<AiToolState> {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const releaseId = String(formData.get("releaseId") || "").trim();

  if (!releaseId) {
    return { error: "Выберите релиз." };
  }

  try {
    const result = await generateReleaseDigest(releaseId);
    await writeAdminAuditEvent({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "generate_release_digest",
      targetType: "release",
      targetId: releaseId,
    });
    return { result };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Не удалось собрать сводку.",
    };
  }
}

export async function generateReleaseForecastAction(
  _prevState: AiToolState,
  formData: FormData,
): Promise<AiToolState> {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const releaseId = String(formData.get("releaseId") || "").trim();

  if (!releaseId) {
    return { error: "Выберите релиз." };
  }

  try {
    const result = await generateReleaseForecast(releaseId);
    await writeAdminAuditEvent({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "generate_release_forecast",
      targetType: "release",
      targetId: releaseId,
    });
    return { result };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Не удалось построить прогноз.",
    };
  }
}

export async function generateMailingDraftAction(
  _prevState: AiToolState,
  formData: FormData,
): Promise<AiToolState> {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const releaseId = String(formData.get("releaseId") || "").trim();
  const purpose = String(formData.get("purpose") || "reminder") as
    | "preorder"
    | "final"
    | "delivery"
    | "reminder";
  const tone = String(formData.get("tone") || "friendly") as
    | "friendly"
    | "neutral"
    | "urgent";

  if (!releaseId) {
    return { error: "Выберите релиз." };
  }

  try {
    const result = await generateReleaseMailingDraft({
      releaseId,
      purpose,
      tone,
    });
    await writeAdminAuditEvent({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "generate_release_mailing_draft",
      targetType: "release",
      targetId: releaseId,
      metadata: {
        purpose,
        tone,
      },
    });
    return { result };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Не удалось сгенерировать рассылку.",
    };
  }
}
