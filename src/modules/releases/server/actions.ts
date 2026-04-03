"use server";

import { requireAdmin } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { assertSameOriginRequest } from "@/lib/request-security";
import { redirect } from "next/navigation";
import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Некорректный slug.");

export async function createReleaseAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const preorderPrice = Number(formData.get("preorderPrice") || 1500);

  if (!title || !slug || !slugSchema.safeParse(slug).success) {
    throw new Error("Название и slug обязательны");
  }

  const release = await prisma.release.create({
    data: {
      title,
      slug,
      preorderPrice,
      preorderOpen: false,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "create_release",
    targetType: "release",
    targetId: release.id,
  });

  redirect("/admin/releases");
}

export async function openReleasePreorderAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const releaseId = String(formData.get("releaseId") || "");

  if (!releaseId) return;

  await prisma.release.update({
    where: { id: releaseId },
    data: {
      preorderOpen: true,
      finalPaymentOpen: false,
      deliveryOpen: false,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "open_release_preorder",
    targetType: "release",
    targetId: releaseId,
  });

  redirect(`/admin/releases/${releaseId}`);
}

export async function closeReleasePreorderAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const releaseId = String(formData.get("releaseId") || "");

  if (!releaseId) return;

  await prisma.release.update({
    where: { id: releaseId },
    data: {
      preorderOpen: false,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "close_release_preorder",
    targetType: "release",
    targetId: releaseId,
  });

  redirect(`/admin/releases/${releaseId}`);
}

export async function updateReleaseInfoAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const releaseId = String(formData.get("releaseId") || "");
  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const preorderPrice = Number(formData.get("preorderPrice") || 1500);

  if (!releaseId || !title || !slug || !slugSchema.safeParse(slug).success) {
    throw new Error("Недостаточно данных для обновления релиза");
  }

  await prisma.release.update({
    where: { id: releaseId },
    data: {
      title,
      slug,
      preorderPrice,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "update_release_info",
    targetType: "release",
    targetId: releaseId,
  });

  redirect(`/admin/releases/${releaseId}`);
}

export async function updateReleaseFinalPaymentAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const releaseId = String(formData.get("releaseId") || "");
  const finalPriceRaw = String(formData.get("finalPrice") || "");

  if (!releaseId) return;

  const finalPrice = finalPriceRaw ? Number(finalPriceRaw) : null;

  await prisma.release.update({
    where: { id: releaseId },
    data: {
      finalPrice,
      preorderOpen: false,
      finalPaymentOpen: true,
      deliveryOpen: false,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "open_release_final_payment",
    targetType: "release",
    targetId: releaseId,
  });

  redirect(`/admin/releases/${releaseId}`);
}

export async function openReleaseDeliveryAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const releaseId = String(formData.get("releaseId") || "");

  if (!releaseId) return;

  await prisma.release.update({
    where: { id: releaseId },
    data: {
      preorderOpen: false,
      finalPaymentOpen: false,
      deliveryOpen: true,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "open_release_delivery",
    targetType: "release",
    targetId: releaseId,
  });

  redirect(`/admin/releases/${releaseId}`);
}

export async function closeReleaseFinalPaymentAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const releaseId = String(formData.get("releaseId") || "");

  if (!releaseId) return;

  await prisma.release.update({
    where: { id: releaseId },
    data: {
      finalPaymentOpen: false,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "close_release_final_payment",
    targetType: "release",
    targetId: releaseId,
  });

  redirect(`/admin/releases/${releaseId}`);
}

export async function closeReleaseDeliveryAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const releaseId = String(formData.get("releaseId") || "");

  if (!releaseId) return;

  await prisma.release.update({
    where: { id: releaseId },
    data: {
      deliveryOpen: false,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "close_release_delivery",
    targetType: "release",
    targetId: releaseId,
  });

  redirect(`/admin/releases/${releaseId}`);
}
