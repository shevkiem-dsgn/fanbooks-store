"use server";

import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function exportReleaseOrders(releaseId: string) {
  const orders = await prisma.order.findMany({
    where: {
      releaseId,
    },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const rows = orders.map((order) => ({
    Заказ: order.id,

    Имя: order.recipientName ?? "",

    Телефон: order.recipientPhone ?? "",

    Email: order.recipientEmail ?? "",

    Страна: order.country ?? "",

    Город: order.city ?? "",

    Адрес: order.address ?? "",

    Индекс: order.postalCode ?? "",

    Состав: order.items
      .map((item) => `${item.product.title} x${item.quantity}`)
      .join(", "),

    Предоплата: order.preorderPaid ? "Да" : "Нет",

    Постоплата: order.finalPaid ? "Да" : "Нет",

    Доставка: order.deliveryPaid ? "Да" : "Нет",

    Трек: order.trackNumber ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return buffer;
}