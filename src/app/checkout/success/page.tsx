"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCartStore } from "@/modules/cart/store";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const clearCart = useCartStore((state) => state.clearCart);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-3xl font-semibold">Заказ оформлен</h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Заказ успешно создан.
        </p>

        {orderId ? (
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Номер заказа: {orderId}
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Link
            href="/account/orders"
            className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            Перейти к заказам
          </Link>

          <Link
            href="/catalog"
            className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium transition hover:opacity-80"
          >
            Вернуться в каталог
          </Link>
        </div>
      </div>
    </main>
  );
}