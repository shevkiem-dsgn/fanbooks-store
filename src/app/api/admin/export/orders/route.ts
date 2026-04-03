import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentAdminUser } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { maskAddress, maskEmail, maskPhone } from "@/lib/personal-data";
import { prisma } from "@/lib/prisma";
import { getOrderStatusLabel } from "@/modules/orders/utils";

export async function GET() {
  const admin = await getCurrentAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "export_orders",
    targetType: "order",
  });

  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
      delivery: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Orders");

  worksheet.columns = [
    { header: "ID заказа", key: "orderId", width: 30 },
    { header: "Статус", key: "status", width: 24 },
    { header: "Имя пользователя", key: "userName", width: 24 },
    { header: "Email", key: "email", width: 30 },
    { header: "Телефон", key: "phone", width: 20 },
    { header: "Получатель", key: "recipientName", width: 24 },
    { header: "Страна", key: "country", width: 18 },
    { header: "Город", key: "city", width: 20 },
    { header: "Адрес", key: "address", width: 40 },
    { header: "Индекс", key: "postalCode", width: 14 },
    { header: "ПВЗ СДЭК", key: "cdekPvzCode", width: 20 },
    { header: "Трек", key: "trackNumber", width: 24 },
    { header: "Предоплата", key: "preorderPaid", width: 14 },
    { header: "Постоплата", key: "finalPaid", width: 14 },
    { header: "Доставка оплачена", key: "deliveryPaid", width: 18 },
    { header: "Сумма постоплаты", key: "finalPaymentAmount", width: 18 },
    { header: "Сумма доставки", key: "deliveryPaymentAmount", width: 18 },
    { header: "Состав заказа", key: "items", width: 60 },
    { header: "Комментарий клиента", key: "comment", width: 30 },
    { header: "Заметка админа", key: "adminNote", width: 30 },
    { header: "Дата создания", key: "createdAt", width: 24 },
  ];

  for (const order of orders) {
    worksheet.addRow({
      orderId: order.id,
      status: getOrderStatusLabel(order.status),
      userName: order.user.name,
      email: maskEmail(order.user.email),
      phone: maskPhone(order.recipientPhone || order.user.phone || ""),
      recipientName: order.recipientName || "",
      country: order.country || "",
      city: order.city || "",
      address: maskAddress(order.address || ""),
      postalCode: order.postalCode || "",
      cdekPvzCode: order.cdekPvzCode || order.delivery?.cdekPvzCode || "",
      trackNumber: order.trackNumber || order.delivery?.trackNumber || "",
      preorderPaid: order.preorderPaid ? "Да" : "Нет",
      finalPaid: order.finalPaid ? "Да" : "Нет",
      deliveryPaid: order.deliveryPaid ? "Да" : "Нет",
      finalPaymentAmount: order.finalPaymentAmount ?? "",
      deliveryPaymentAmount: order.deliveryPaymentAmount ?? "",
      items: order.items
        .map(
          (item) =>
            `${item.product.title} (${item.itemType === "BOOK" ? "Книга" : "Мерч"}) × ${item.quantity}`,
        )
        .join("; "),
      comment: order.comment || "",
      adminNote: order.adminNote || "",
      createdAt: order.createdAt.toLocaleString("ru-RU"),
    });
  }

  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="orders.xlsx"`,
    },
  });
}
