import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { exportReleaseOrders } from "@/modules/releases/server/export-release-orders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "export_release_orders_legacy",
    targetType: "release",
    targetId: id,
  });

  const buffer = await exportReleaseOrders(id);

  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": `attachment; filename="release-orders.xlsx"`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
