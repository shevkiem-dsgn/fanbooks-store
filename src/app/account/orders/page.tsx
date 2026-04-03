import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrderStatusLabel } from "@/modules/orders/utils";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
    },
    include: {
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
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Мои заказы</h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-[var(--muted-foreground)]">
          У тебя пока нет заказов.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="border border-[var(--border)] bg-[var(--card)] p-5 transition hover:opacity-90"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Заказ
                  </div>
                  <div className="font-medium">{order.id}</div>
                </div>

                <div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Статус
                  </div>
                  <div className="font-medium">{getOrderStatusLabel(order.status)}</div>
                </div>

                <div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Позиций
                  </div>
                  <div className="font-medium">{order.items.length}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
