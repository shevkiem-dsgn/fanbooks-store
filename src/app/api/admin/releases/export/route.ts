import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { maskAddress, maskEmail, maskPhone } from "@/lib/personal-data";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { getReleaseOrderSummaries } from "@/modules/releases/server/service";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const releaseId = request.nextUrl.searchParams.get("releaseId");

  if (!releaseId) {
    return new NextResponse("releaseId is required", { status: 400 });
  }

  const release = await prisma.release.findUnique({
    where: {
      id: releaseId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!release) {
    return new NextResponse("Release not found", { status: 404 });
  }

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "export_release_orders",
    targetType: "release",
    targetId: releaseId,
  });

  const orders = await getReleaseOrderSummaries(releaseId);

  const rows = orders.map((order) => ({
    Заказ: order.id,
    Имя: order.recipientName ?? order.user.name,
    Телефон: maskPhone(order.recipientPhone ?? ""),
    Email: maskEmail(order.recipientEmail ?? order.user.email),
    Страна: order.country ?? "",
    Город: order.city ?? "",
    Адрес: maskAddress(order.address ?? ""),
    Индекс: order.postalCode ?? "",
    Состав: order.items
      .map((item) => `${item.productTitle} x${item.quantity}`)
      .join(", "),
    "Книг по релизу": order.booksCount,
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

  const safeTitle = release.title.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim() || "release";

  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": `attachment; filename="${safeTitle}-orders.xlsx"`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
