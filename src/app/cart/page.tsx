"use client";

import Link from "next/link";
import { useCartStore } from "@/modules/cart/store";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const changeQuantity = useCartStore((state) => state.changeQuantity);

  const total = items.reduce((sum, item) => {
    if (!item.price) return sum;
    return sum + item.price * item.quantity;
  }, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Корзина</h1>
        <p className="text-[var(--muted-foreground)]">
          Проверь выбранные товары перед оформлением заказа.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 border border-[var(--border)] bg-[var(--card)] p-6">
          <p className="text-[var(--muted-foreground)]">Корзина пока пуста.</p>
          <Link
            href="/catalog"
            className="mt-4 inline-block border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="grid gap-4 border border-[var(--border)] bg-[var(--card)] p-4 md:grid-cols-[120px_1fr_auto]"
              >
                <div className="aspect-[3/4] overflow-hidden bg-[var(--muted)]">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">
                      Нет фото
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-sm text-[var(--muted-foreground)]">
                    {item.type === "BOOK" ? "Книга" : "Мерч"}
                  </div>
                  <h2 className="text-lg font-medium">{item.title}</h2>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    {item.price ? `${item.price} ₽` : "Цена уточняется"}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <div className="flex items-center border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(item.productId, item.quantity - 1)
                      }
                      className="px-3 py-2 text-sm"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(item.productId, item.quantity + 1)
                      }
                      className="px-3 py-2 text-sm"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
              <span>Товаров</span>
              <span>{items.length}</span>
            </div>

            <div className="mt-4 flex items-center justify-between text-lg font-semibold">
              <span>Итого</span>
              <span>{total} ₽</span>
            </div>

            <Link
              href="/checkout"
              className="mt-6 block border border-transparent bg-[var(--accent)] px-5 py-3 text-center text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
            >
              Перейти к оформлению
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}