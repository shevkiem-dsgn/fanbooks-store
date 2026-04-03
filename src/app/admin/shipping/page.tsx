import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  createBulkCdekShipmentsAction,
  createCdekShipmentAction,
} from "@/modules/admin/server/actions";
import { getOrderStatusLabel } from "@/modules/orders/utils";

export default async function AdminShippingPage() {
  const readyOrders = await prisma.order.findMany({
    where: {
      status: "READY_TO_SHIP",
      deliveryPaid: true,
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

  const shippedOrders = await prisma.order.findMany({
    where: {
      trackNumber: {
        not: null,
      },
    },
    include: {
      user: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">Отправки</h1>
          <p className="text-[var(--muted-foreground)]">
            Заказы, готовые к отправке, и уже созданные отправления.
          </p>
        </div>

        <form action={createBulkCdekShipmentsAction}>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/api/admin/shipping/manifest"
              className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm transition hover:opacity-80"
            >
              Скачать накладные по релизам
            </Link>
            <button
              type="submit"
              className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
            >
              Создать отправления для всех готовых заказов
            </button>
          </div>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-medium">Готовы к отправке</h2>

        {readyOrders.length === 0 ? (
          <div className="mt-4 border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--muted-foreground)]">
            Сейчас нет заказов, готовых к отправке.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto border border-[var(--border)] bg-[var(--card)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-4 py-3">Заказ</th>
                  <th className="px-4 py-3">Пользователь</th>
                  <th className="px-4 py-3">Получатель</th>
                  <th className="px-4 py-3">Город</th>
                  <th className="px-4 py-3">ПВЗ</th>
                  <th className="px-4 py-3">Состав</th>
                  <th className="px-4 py-3">Действие</th>
                </tr>
              </thead>

              <tbody>
                {readyOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]"
                  >
                    <td className="px-4 py-3">{order.id}</td>
                    <td className="px-4 py-3">
                      <div>{order.user.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {order.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">{order.recipientName || "—"}</td>
                    <td className="px-4 py-3">{order.city || "—"}</td>
                    <td className="px-4 py-3">
                      {order.cdekPvzCode ? (
                        <div>
                          <div>{order.cdekPvzCode}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {order.address || "—"}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.items
                        .map(
                          (item) =>
                            `${item.product.title} × ${item.quantity}`,
                        )
                        .join("; ")}
                    </td>
                    <td className="px-4 py-3">
                      {order.trackNumber ? (
                        <span className="text-[var(--muted-foreground)]">
                          Уже отправлен
                        </span>
                      ) : (
                        <form action={createCdekShipmentAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <button
                            type="submit"
                            className="border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm transition hover:opacity-80"
                          >
                            Создать отправление
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium">Последние отправленные</h2>

        {shippedOrders.length === 0 ? (
          <div className="mt-4 border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--muted-foreground)]">
            Отправлений пока нет.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto border border-[var(--border)] bg-[var(--card)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-4 py-3">Заказ</th>
                  <th className="px-4 py-3">Пользователь</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Трек</th>
                  <th className="px-4 py-3">CDEK ID</th>
                </tr>
              </thead>

              <tbody>
                {shippedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]"
                  >
                    <td className="px-4 py-3">{order.id}</td>
                    <td className="px-4 py-3">
                      <div>{order.user.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {order.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getOrderStatusLabel(order.status)}
                    </td>
                    <td className="px-4 py-3">{order.trackNumber || "—"}</td>
                    <td className="px-4 py-3">{order.cdekOrderId || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
