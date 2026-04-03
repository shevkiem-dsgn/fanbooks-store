"use client";

import { useActionState, useMemo } from "react";
import { useCartStore } from "@/modules/cart/store";
import {
  createOrderAction,
  type CheckoutActionState,
} from "@/modules/orders/server/actions";
import { CdekOfficeSelect } from "@/modules/shipping/cdek/ui/office-select";

type Props = {
  user: {
    name: string;
    email: string;
    phone: string;
    recipientName: string;
    country: string;
    cdekPvzCode?: string;
    cdekPvzCity?: string;
    cdekPvzAddress?: string;
  };
  releaseId?: string;
};

const initialState: CheckoutActionState = {};

export function CheckoutForm({ user, releaseId }: Props) {
  const items = useCartStore((state) => state.items);
  const [state, formAction, pending] = useActionState(
    createOrderAction,
    initialState,
  );

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.price) return sum;
      return sum + item.price * item.quantity;
    }, 0);
  }, [items]);

  const cartItemsPayload = JSON.stringify(
    items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      releaseId: item.releaseId,
    })),
  );

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">Данные получателя</h2>

        <div className="mt-5 grid gap-4">
          <input
            name="recipientName"
            defaultValue={user.recipientName}
            placeholder="ФИО получателя"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />
          <input
            name="recipientPhone"
            defaultValue={user.phone}
            placeholder="Телефон"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />
          <input
            name="recipientEmail"
            defaultValue={user.email}
            placeholder="Email"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />
          <input
            name="country"
            defaultValue={user.country}
            placeholder="Страна"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />
          <CdekOfficeSelect
            initialOffice={
              user.cdekPvzCode && user.cdekPvzCity && user.cdekPvzAddress
                ? {
                    code: user.cdekPvzCode,
                    city: user.cdekPvzCity,
                    address: user.cdekPvzAddress,
                  }
                : undefined
            }
          />
          <input type="hidden" name="country" value={user.country || "Россия"} />
          <textarea
            name="comment"
            placeholder="Комментарий к заказу"
            className="min-h-28 border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <p className="text-sm text-[var(--muted-foreground)]">
            Доставка пока оформляется через ПВЗ СДЭК. Выбери пункт выдачи, и он
            сохранится в заказе.
          </p>

          <input type="hidden" name="cartItems" value={cartItemsPayload} />
          <input type="hidden" name="releaseId" value={releaseId ?? ""} />

          {state.error ? (
            <p className="text-sm text-red-400">{state.error}</p>
          ) : null}
        </div>
      </div>

      <aside className="h-fit border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-lg font-medium">Состав заказа</h2>

        <div className="mt-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Корзина пуста.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-sm"
              >
                <span>{item.title}</span>
                <span>
                  {item.quantity} × {item.price ?? 0} ₽
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex items-center justify-between text-lg font-semibold">
          <span>Итого</span>
          <span>{total} ₽</span>
        </div>

        <button
          type="submit"
          disabled={pending || items.length === 0}
          className="mt-6 block w-full border border-transparent bg-[var(--accent)] px-5 py-3 text-center text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Создание заказа..." : "Оформить заказ"}
        </button>
      </aside>
    </form>
  );
}
