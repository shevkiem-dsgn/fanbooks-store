import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import * as XLSX from "xlsx";
import { getAnalyticsOverview } from "@/modules/analytics/server/service";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "export_analytics",
    targetType: "analytics",
    metadata: {
      period: request.nextUrl.searchParams.get("period") || "14",
    },
  });

  const periodParam = Number(request.nextUrl.searchParams.get("period") || "14");
  const allowedPeriods = [7, 14, 30, 90];
  const period = allowedPeriods.includes(periodParam) ? periodParam : 14;

  const analytics = await getAnalyticsOverview(period);

  const workbook = XLSX.utils.book_new();

  const overviewRows = [
    { Показатель: "Период (дней)", Значение: analytics.periodDays },
    { Показатель: "Всего заказов", Значение: analytics.totals.totalOrders },
    { Показатель: "Пользователей", Значение: analytics.totals.totalUsers },
    { Показатель: "Товаров", Значение: analytics.totals.totalProducts },
    { Показатель: "Книг заказано", Значение: analytics.totals.totalBooksOrdered },
    { Показатель: "Ждут отправку", Значение: analytics.totals.readyToShipCount },
    { Показатель: "Релизы с риском", Значение: analytics.totals.releasesNeedAttention },
    { Показатель: "Общая выручка", Значение: analytics.money.totalRevenue },
    { Показатель: "Выручка за период", Значение: analytics.money.revenueInPeriod },
    { Показатель: "Средний чек", Значение: analytics.money.averageOrderValue },
    { Показатель: "Предоплаты", Значение: analytics.money.preorderCollected },
    { Показатель: "Постоплаты", Значение: analytics.money.finalCollected },
    { Показатель: "Доставка", Значение: analytics.money.deliveryCollected },
    { Показатель: "Ещё ждём по постоплатам", Значение: analytics.money.expectedFinalRevenue },
    { Показатель: "Ещё ждём по доставке", Значение: analytics.money.expectedDeliveryRevenue },
  ];

  const releasesRows = analytics.releaseStats.map((release) => ({
    Релиз: release.title,
    Статус: release.statusLabel,
    Заказов: release.totalOrders,
    Книг: release.booksOrdered,
    "Мин. тираж": release.minPrintRun || "",
    "Не хватает до тиража": release.minPrintRun > 0 ? release.remainingToMinPrintRun : "",
    Выручка: release.collectedRevenue,
    Предоплата: release.preorderPaid,
    Постоплата: release.finalPaid,
    Доставка: release.deliveryPaid,
    Отказы: release.droppedAfterPreorder,
    "Конверсия 1 этап (%)": release.preorderConversion,
    "Конверсия 2 этап (%)": release.finalConversion,
    "Конверсия доставки (%)": release.deliveryConversion,
    Действие: release.actionLabel,
  }));

  const dailyRows = analytics.dailyStats.map((row) => ({
    Дата: row.date,
    Заказы: row.orders,
    Выручка: row.revenue,
  }));

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(overviewRows),
    "Overview",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(releasesRows),
    "Releases",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(dailyRows),
    "Daily",
  );

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": `attachment; filename="analytics-${period}d.xlsx"`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
