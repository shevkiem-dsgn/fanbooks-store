import { prisma } from "@/lib/prisma";

export function estimateDeliveryPrice(args: {
  city: string | null;
  booksCount: number;
  hasMerch: boolean;
}) {
  const city = (args.city || "").toLowerCase();
  const additionalBooks = Math.max(args.booksCount - 1, 0);

  let basePrice = 430;

  if (city.includes("моск")) {
    basePrice = 320;
  } else if (
    city.includes("санкт") ||
    city.includes("петербург") ||
    city.includes("ленинград")
  ) {
    basePrice = 360;
  } else if (
    city.includes("екатеринбург") ||
    city.includes("новосибирск") ||
    city.includes("красноярск") ||
    city.includes("иркутск") ||
    city.includes("владивосток") ||
    city.includes("хабаровск")
  ) {
    basePrice = 560;
  } else if (
    city.includes("сочи") ||
    city.includes("ростов") ||
    city.includes("самара") ||
    city.includes("казань") ||
    city.includes("уфа") ||
    city.includes("пермь") ||
    city.includes("челябинск")
  ) {
    basePrice = 490;
  }

  return basePrice + additionalBooks * 70 + (args.hasMerch ? 90 : 0);
}

export async function createCdekShipment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.cdekPvzCode) {
    throw new Error("Pickup point is not selected");
  }

  if (order.trackNumber) {
    return {
      cdekOrderId: order.cdekOrderId,
      trackNumber: order.trackNumber,
    };
  }

  /**
   * Здесь позже будет реальный API СДЭК
   * Сейчас имитируем создание отправления
   */

  const fakeCdekOrderId = "CDEK_" + Date.now();
  const fakeTrackNumber = "TRK" + Math.floor(Math.random() * 100000000);

  await prisma.order.update({
    where: { id: order.id },
    data: {
      cdekOrderId: fakeCdekOrderId,
      trackNumber: fakeTrackNumber,
      status: "SHIPPED",
    },
  });

  return {
    cdekOrderId: fakeCdekOrderId,
    trackNumber: fakeTrackNumber,
  };
}
