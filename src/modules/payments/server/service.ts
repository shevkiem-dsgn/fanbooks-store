import type { PaymentStatus, PaymentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCdekShipment } from "@/modules/shipping/cdek/server/service";

export type PaymentKind = "initial" | "final" | "delivery";

function mapPaymentType(kind: PaymentKind): PaymentType {
  switch (kind) {
    case "initial":
      return "PREORDER";
    case "final":
      return "FINAL";
    case "delivery":
      return "DELIVERY";
  }
}

export async function getOrderForPayment(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              release: true,
            },
          },
        },
      },
      payments: true,
    },
  });
}

export function calculatePaymentAmount(
  order: NonNullable<Awaited<ReturnType<typeof getOrderForPayment>>>,
  paymentKind: PaymentKind,
) {
  if (paymentKind === "initial") {
    return order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  if (paymentKind === "final") {
    const releaseMap = new Map<string, number>();

    for (const item of order.items) {
      if (item.product.type !== "BOOK") continue;
      if (item.product.paymentMode === "FULL_PAYMENT") continue;
      if (!item.product.release) continue;
      if (!item.product.release.finalPaymentOpen) continue;
      if (releaseMap.has(item.product.release.id)) continue;

      const diff =
        (item.product.release.finalPrice ?? 0) - item.product.release.preorderPrice;

      if (diff > 0) {
        releaseMap.set(item.product.release.id, diff);
      }
    }

    return Array.from(releaseMap.values()).reduce((sum, value) => sum + value, 0);
  }

  const hasClosedDelivery = order.items.some(
    (item) => item.product.type === "BOOK" && item.product.release && !item.product.release.deliveryOpen,
  );

  if (hasClosedDelivery) {
    return 0;
  }

  return order.deliveryPaymentAmount ?? 0;
}

export async function applyPaymentSuccess(args: {
  order: NonNullable<Awaited<ReturnType<typeof getOrderForPayment>>>;
  paymentKind: PaymentKind;
  provider: string;
  transactionId: string;
  rawStatus?: PaymentStatus;
  amount?: number;
}) {
  const { order, paymentKind, provider, transactionId } = args;
  const amount = args.amount ?? calculatePaymentAmount(order, paymentKind);

  if (amount <= 0) {
    throw new Error("Сумма оплаты не определена.");
  }

  if (
    (paymentKind === "initial" && order.preorderPaid) ||
    (paymentKind === "final" && order.finalPaid) ||
    (paymentKind === "delivery" && order.deliveryPaid)
  ) {
    return;
  }

  await prisma.payment.create({
    data: {
      orderId: order.id,
      type: mapPaymentType(paymentKind),
      amount,
      status: "SUCCEEDED",
      provider,
      transactionId,
      paidAt: new Date(),
    },
  });

  if (paymentKind === "initial") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        preorderPaid: true,
        status: "WAITING_FINAL_PAYMENT",
      },
    });
  }

  if (paymentKind === "final") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        finalPaid: true,
        status: "WAITING_DELIVERY_PAYMENT",
      },
    });
  }

  if (paymentKind === "delivery") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        deliveryPaid: true,
        status: "READY_TO_SHIP",
      },
    });

    await createCdekShipment(order.id);
  }
}
