import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const ordersCount = await prisma.order.count();
  const productsCount = await prisma.product.count();
  const activeOrdersCount = await prisma.order.count({
    where: {
      status: {
        in: ["ACTIVE", "WAITING_FINAL_PAYMENT", "WAITING_DELIVERY_PAYMENT", "READY_TO_SHIP"],
      },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Админка</h1>
        <p className="text-[var(--muted-foreground)]">
          Управление товарами, заказами и логикой издательства.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Всего заказов</div>
          <div className="mt-2 text-3xl font-semibold">{ordersCount}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Товаров</div>
          <div className="mt-2 text-3xl font-semibold">{productsCount}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Активные заказы</div>
          <div className="mt-2 text-3xl font-semibold">{activeOrdersCount}</div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
  <Link
    href="/admin/orders"
    className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
  >
    Перейти к заказам
  </Link>

  <Link
    href="/admin/products"
    className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium transition hover:opacity-80"
  >
    Перейти к товарам
  </Link>
  
  <Link
  href="/admin/releases"
  className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm"
>
  Управление релизами
</Link>

  <Link
    href="/admin/shipping"
    className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium transition hover:opacity-80"
  >
    Перейти к отправкам
  </Link>

  <Link
  href="/admin/exports"
  className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium transition hover:opacity-80"
>
  Экспорт таблиц
</Link>

<Link
  href="/admin/analytics"
  className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium transition hover:opacity-80"
>
  Аналитика
</Link>

<Link
  href="/admin/mailings"
  className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium transition hover:opacity-80"
>
  Telegram-рассылки
</Link>

<Link
  href="/admin/ai"
  className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium transition hover:opacity-80"
>
  ИИ-помощник
</Link>

</div>
    </main>
  );
}
