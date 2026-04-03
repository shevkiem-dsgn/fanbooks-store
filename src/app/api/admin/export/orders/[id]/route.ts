import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentAdminUser } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { getOrderStatusLabel } from "@/modules/orders/utils";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Props) {
  const admin = await getCurrentAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "export_single_order",
    targetType: "order",
    targetId: id,
  });

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
      delivery: true,
      payments: true,
    },
  });

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet("Order");
  summarySheet.columns = [
    { header: "Поле", key: "field", width: 28 },
    { header: "Значение", key: "value", width: 60 },
  ];

  summarySheet.addRows([
    { field: "ID заказа", value: order.id },
    { field: "Статус", value: getOrderStatusLabel(order.status) },
    { field: "Пользователь", value: order.user.name },
    { field: "Email", value: order.user.email },
    { field: "Телефон", value: order.recipientPhone || order.user.phone || "" },
    { field: "Получатель", value: order.recipientName || "" },
    { field: "Страна", value: order.country || "" },
    { field: "Город", value: order.city || "" },
    { field: "Адрес", value: order.address || "" },
    { field: "Индекс", value: order.postalCode || "" },
    { field: "ПВЗ СДЭК", value: order.cdekPvzCode || order.delivery?.cdekPvzCode || "" },
    { field: "Трек", value: order.trackNumber || order.delivery?.trackNumber || "" },
    { field: "Предоплата", value: order.preorderPaid ? "Да" : "Нет" },
    { field: "Постоплата", value: order.finalPaid ? "Да" : "Нет" },
    { field: "Доставка оплачена", value: order.deliveryPaid ? "Да" : "Нет" },
    { field: "Сумма постоплаты", value: order.finalPaymentAmount ?? "" },
    { field: "Сумма доставки", value: order.deliveryPaymentAmount ?? "" },
    { field: "Комментарий клиента", value: order.comment || "" },
    { field: "Заметка админа", value: order.adminNote || "" },
    { field: "Дата создания", value: order.createdAt.toLocaleString("ru-RU") },
  ]);

  summarySheet.getRow(1).font = { bold: true };

  const itemsSheet = workbook.addWorksheet("Items");
  itemsSheet.columns = [
    { header: "Название", key: "title", width: 40 },
    { header: "Тип", key: "type", width: 16 },
    { header: "Количество", key: "quantity", width: 14 },
    { header: "Цена", key: "unitPrice", width: 14 },
  ];

  for (const item of order.items) {
    itemsSheet.addRow({
      title: item.product.title,
      type: item.itemType === "BOOK" ? "Книга" : "Мерч",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
  }

  itemsSheet.getRow(1).font = { bold: true };

  const paymentsSheet = workbook.addWorksheet("Payments");
  paymentsSheet.columns = [
    { header: "Тип", key: "type", width: 18 },
    { header: "Сумма", key: "amount", width: 14 },
    { header: "Статус", key: "status", width: 18 },
    { header: "Провайдер", key: "provider", width: 20 },
    { header: "Транзакция", key: "transactionId", width: 28 },
    { header: "Дата оплаты", key: "paidAt", width: 24 },
  ];

  for (const payment of order.payments) {
    paymentsSheet.addRow({
      type: payment.type,
      amount: payment.amount,
      status: payment.status,
      provider: payment.provider || "",
      transactionId: payment.transactionId || "",
      paidAt: payment.paidAt ? payment.paidAt.toLocaleString("ru-RU") : "",
    });
  }

  paymentsSheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="order-${order.id}.xlsx"`,
    },
  });
}
