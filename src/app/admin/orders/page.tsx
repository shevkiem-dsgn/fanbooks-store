import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getOrderStatusLabel,
  getPaymentBooleanLabel,
} from "@/modules/orders/utils";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">Заказы</h1>
          <p className="text-[var(--muted-foreground)]">
            Все заказы пользователей.
          </p>
        </div>

        <Link
          href="/api/admin/export/orders"
          className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
        >
          Скачать Excel
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto border border-[var(--border)] bg-[var(--card)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3">Заказ</th>
              <th className="px-4 py-3">Пользователь</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Позиций</th>
              <th className="px-4 py-3">Предоплата</th>
              <th className="px-4 py-3">Постоплата</th>
              <th className="px-4 py-3">Доставка</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="underline underline-offset-4"
                  >
                    {order.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div>{order.user.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {order.user.email}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getOrderStatusLabel(order.status)}
                </td>
                <td className="px-4 py-3">{order.items.length}</td>
                <td className="px-4 py-3">
                  {getPaymentBooleanLabel(order.preorderPaid)}
                </td>
                <td className="px-4 py-3">
                  {getPaymentBooleanLabel(order.finalPaid)}
                </td>
                <td className="px-4 py-3">
                  {getPaymentBooleanLabel(order.deliveryPaid)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
