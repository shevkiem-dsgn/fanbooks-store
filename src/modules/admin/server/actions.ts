"use server";

import type { OrderStatus, ProductStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { assertSameOriginRequest } from "@/lib/request-security";
import { redirect } from "next/navigation";
import { createCdekShipment } from "@/modules/shipping/cdek/server/service";
import { z } from "zod";

const orderStatusSchema = z.enum([
  "CREATED",
  "ACTIVE",
  "WAITING_FINAL_PAYMENT",
  "WAITING_DELIVERY_PAYMENT",
  "READY_TO_SHIP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "REFUND_REQUESTED",
  "REFUND_APPROVED",
  "REFUND_COMPLETED",
]);

const productStatusSchema = z.enum([
  "ANNOUNCEMENT",
  "APPLICATIONS_OPEN",
  "PRINTING_WAIT",
  "PAYMENT",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
]);

export async function updateOrderStatusAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  const parsedStatus = orderStatusSchema.safeParse(status);

  if (!orderId || !parsedStatus.success) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: parsedStatus.data as OrderStatus,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "update_order_status",
    targetType: "order",
    targetId: orderId,
    metadata: { status: parsedStatus.data },
  });

  redirect(`/admin/orders/${orderId}`);
}

export async function updateOrderPricingAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") || "");
  const finalPaymentAmountRaw = String(formData.get("finalPaymentAmount") || "");
  const deliveryPaymentAmountRaw = String(formData.get("deliveryPaymentAmount") || "");
  const adminNote = String(formData.get("adminNote") || "").trim();

  if (!orderId) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      finalPaymentAmount: finalPaymentAmountRaw ? Number(finalPaymentAmountRaw) : null,
      deliveryPaymentAmount: deliveryPaymentAmountRaw ? Number(deliveryPaymentAmountRaw) : null,
      adminNote: adminNote || null,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "update_order_pricing",
    targetType: "order",
    targetId: orderId,
  });

  redirect(`/admin/orders/${orderId}`);
}

export async function updateProductStatusAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const productId = String(formData.get("productId") || "");
  const status = String(formData.get("status") || "");
  const parsedStatus = productStatusSchema.safeParse(status);

  if (!productId || !parsedStatus.success) return;

  await prisma.product.update({
    where: { id: productId },
    data: {
      status: parsedStatus.data as ProductStatus,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "update_product_status",
    targetType: "product",
    targetId: productId,
    metadata: { status: parsedStatus.data },
  });

  redirect(`/admin/products/${productId}`);
}

export async function markPreorderPaidAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") || "");
  if (!orderId) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      preorderPaid: true,
      status: "WAITING_FINAL_PAYMENT",
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "mark_preorder_paid",
    targetType: "order",
    targetId: orderId,
  });

  redirect(`/admin/orders/${orderId}`);
}

export async function markFinalPaidAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") || "");
  if (!orderId) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      finalPaid: true,
      status: "WAITING_DELIVERY_PAYMENT",
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "mark_final_paid",
    targetType: "order",
    targetId: orderId,
  });

  redirect(`/admin/orders/${orderId}`);
}

export async function markDeliveryPaidAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") || "");
  if (!orderId) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryPaid: true,
      status: "READY_TO_SHIP",
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "mark_delivery_paid",
    targetType: "order",
    targetId: orderId,
  });

  redirect(`/admin/orders/${orderId}`);
}

export async function saveTrackNumberAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") || "");
  const trackNumber = String(formData.get("trackNumber") || "").trim();

  if (!orderId) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      trackNumber: trackNumber || null,
      status: trackNumber ? "SHIPPED" : undefined,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "save_track_number",
    targetType: "order",
    targetId: orderId,
  });

  redirect(`/admin/orders/${orderId}`);
}

export async function createCdekShipmentAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") || "");

  if (!orderId) return;

  await createCdekShipment(orderId);

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "create_cdek_shipment",
    targetType: "order",
    targetId: orderId,
  });

  return;
}

export async function createBulkCdekShipmentsAction() {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const orders = await prisma.order.findMany({
    where: {
      status: "READY_TO_SHIP",
      deliveryPaid: true,
      trackNumber: null,
    },
    select: {
      id: true,
    },
  });

  for (const order of orders) {
    await createCdekShipment(order.id);
  }

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "create_bulk_cdek_shipments",
    targetType: "shipping",
    metadata: { ordersCount: orders.length },
  });

  redirect("/admin/shipping");
}
