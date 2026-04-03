"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

function getPaymentTypeLabel(type: string | null) {
  switch (type) {
    case "preorder":
      return "Предоплата";
    case "final":
      return "Постоплата";
    case "delivery":
      return "Оплата доставки";
    default:
      return "Оплата";
  }
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const type = searchParams.get("type");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-3xl font-semibold">Оплата прошла успешно</h1>

        <p className="mt-3 text-[var(--muted-foreground)]">
          Этап оплаты завершён: {getPaymentTypeLabel(type)}.
        </p>

        {orderId ? (
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Заказ: {orderId}
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          {orderId ? (
            <Link
              href={`/account/orders/${orderId}`}
              className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
            >
              Вернуться к заказу
            </Link>
          ) : null}

          <Link
            href="/account/orders"
            className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium transition hover:opacity-80"
          >
            Все заказы
          </Link>
        </div>
      </div>
    </main>
  );
}