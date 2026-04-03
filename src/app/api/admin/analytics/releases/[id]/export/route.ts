import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentAdminUser } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { getReleaseAnalytics } from "@/modules/analytics/server/service";

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
    action: "export_release_analytics",
    targetType: "release",
    targetId: id,
  });

  const analytics = await getReleaseAnalytics(id);

  if (!analytics) {
    return new NextResponse("Release not found", { status: 404 });
  }

  const workbook = XLSX.utils.book_new();

  const overviewRows = [
    { Показатель: "Релиз", Значение: analytics.release.title },
    { Показатель: "Slug", Значение: analytics.release.slug },
    { Показатель: "Статус", Значение: analytics.release.status },
    { Показатель: "Предоплата", Значение: analytics.release.preorderPrice },
    { Показатель: "Финальная цена", Значение: analytics.release.finalPrice ?? "" },
    { Показатель: "Заказано книг", Значение: analytics.focus.booksOrdered },
    { Показатель: "Минимальный тираж", Значение: analytics.focus.minPrintRun || "" },
    {
      Показатель: "Не хватает до печати",
      Значение:
        analytics.focus.minPrintRun > 0 ? analytics.focus.remainingToMinPrintRun : "",
    },
    { Показатель: "Собрано всего", Значение: analytics.money.collectedRevenue },
    { Показатель: "Ещё ждём по постоплатам", Значение: analytics.money.expectedFinalRevenue },
    { Показатель: "Ещё ждём по доставке", Значение: analytics.money.expectedDeliveryRevenue },
    { Показатель: "Всего заказов", Значение: analytics.funnel.totalOrders },
    { Показатель: "Оплатили предоплату", Значение: analytics.funnel.preorderPaid },
    { Показатель: "Оплатили постоплату", Значение: analytics.funnel.finalPaid },
    { Показатель: "Оплатили доставку", Значение: analytics.funnel.deliveryPaid },
    { Показатель: "Отправлено", Значение: analytics.funnel.shipped },
    { Показатель: "Отвалились после предоплаты", Значение: analytics.focus.droppedAfterPreorder },
  ];

  const productsRows = analytics.products.map((product) => ({
    Товар: product.title,
    Тип: product.type === "BOOK" ? "Книга" : "Мерч",
    "Продано единиц": product.soldUnits,
    Выручка: product.revenue,
  }));

  const ordersRows = analytics.orderRows.map((order) => ({
    Заказ: order.id,
    Пользователь: order.userName,
    Email: order.userEmail,
    Книг: order.booksCount,
    Предоплата: order.preorderPaid ? "Да" : "Нет",
    Постоплата: order.finalPaid ? "Да" : "Нет",
    Доставка: order.deliveryPaid ? "Да" : "Нет",
    "Оплачено всего": order.totalPaid,
    "Следующий шаг": order.nextStep,
  }));

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(overviewRows),
    "Overview",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(productsRows),
    "Products",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(ordersRows),
    "Orders",
  );

  const safeTitle =
    analytics.release.title.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim() || "release";

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": `attachment; filename="${safeTitle}-analytics.xlsx"`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
