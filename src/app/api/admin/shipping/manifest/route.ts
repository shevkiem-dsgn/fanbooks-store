import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentAdminUser } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { getReleaseOrderSummaries } from "@/modules/releases/server/service";

export async function GET() {
  const admin = await getCurrentAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "export_shipping_manifest",
    targetType: "shipping",
  });

  const releases = await prisma.release.findMany({
    where: {
      products: {
        some: {
          type: "BOOK",
          orderItems: {
            some: {
              order: {
                deliveryPaid: true,
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
    },
  });

  const workbook = XLSX.utils.book_new();

  for (const release of releases) {
    const orders = await getReleaseOrderSummaries(release.id);
    const deliveryOrders = orders.filter((order) => order.deliveryPaid);

    if (deliveryOrders.length === 0) {
      continue;
    }

    const rows = deliveryOrders.map((order) => ({
      Заказ: order.id,
      Получатель: order.recipientName ?? order.user.name,
      Телефон: order.recipientPhone ?? "",
      Email: order.recipientEmail ?? order.user.email,
      Город: order.city ?? "",
      "Код ПВЗ": order.cdekPvzCode ?? "",
      "Адрес ПВЗ": order.address ?? "",
      Книги: order.items.map((item) => `${item.productTitle} x${item.quantity}`).join(", "),
      Трек: order.trackNumber ?? "",
    }));

    const sheetName = release.title.slice(0, 28) || "Release";
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), sheetName);
  }

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": 'attachment; filename="shipping-manifest.xlsx"',
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
