import { notFound } from "next/navigation";
import { createCdekShipmentAction } from "@/modules/admin/server/actions";
import { prisma } from "@/lib/prisma";
import {
  markDeliveryPaidAction,
  markFinalPaidAction,
  markPreorderPaidAction,
  updateOrderPricingAction,
  updateOrderStatusAction,
} from "@/modules/admin/server/actions";
import {
  getOrderStatusLabel,
  getPaymentBooleanLabel,
} from "@/modules/orders/utils";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const ORDER_STATUSES = [
  { value: "CREATED", label: "Создан" },
  { value: "ACTIVE", label: "Активен" },
  { value: "WAITING_FINAL_PAYMENT", label: "Ожидает постоплату" },
  { value: "WAITING_DELIVERY_PAYMENT", label: "Ожидает оплату доставки" },
  { value: "READY_TO_SHIP", label: "Готов к отправке" },
  { value: "SHIPPED", label: "Отправлен" },
  { value: "COMPLETED", label: "Завершён" },
  { value: "CANCELLED", label: "Отменён" },
  { value: "REFUND_REQUESTED", label: "Запрошен возврат" },
  { value: "REFUND_APPROVED", label: "Возврат одобрен" },
  { value: "REFUND_COMPLETED", label: "Возврат выполнен" },
];

export default async function AdminOrderDetailsPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
      delivery: true,
      payments: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">Заказ {order.id}</h1>
          <p className="text-[var(--muted-foreground)]">
            Управление заказом пользователя.
          </p>
        </div>

        <a
          href={`/api/admin/export/orders/${order.id}`}
          className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
        >
          Скачать Excel
        </a>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Состав заказа</h2>

            <div className="mt-5 flex flex-col gap-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-[var(--border)] pb-3"
                >
                  <div>
                    <div className="font-medium">{item.product.title}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {item.itemType === "BOOK" ? "Книга" : "Мерч"} • {item.quantity} шт.
                    </div>
                  </div>

                  <div className="text-sm">{item.unitPrice} ₽</div>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Пользователь и доставка</h2>

            <div className="mt-5 grid gap-3 text-sm">
              <div>
                <span className="text-[var(--muted-foreground)]">Имя:</span>{" "}
                {order.user.name}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Email:</span>{" "}
                {order.user.email}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Телефон:</span>{" "}
                {order.recipientPhone || order.user.phone || "—"}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Получатель:</span>{" "}
                {order.recipientName || "—"}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Страна:</span>{" "}
                {order.country || "—"}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Город:</span>{" "}
                {order.city || "—"}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Адрес:</span>{" "}
                {order.address || "—"}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Индекс:</span>{" "}
                {order.postalCode || "—"}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Трек:</span>{" "}
                {order.trackNumber || order.delivery?.trackNumber || "ещё не добавлен"}
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Текущий статус</h2>

            <div className="mt-4 text-sm font-medium">
              {getOrderStatusLabel(order.status)}
            </div>

            <form action={updateOrderStatusAction} className="mt-5 flex flex-col gap-4">
              <input type="hidden" name="orderId" value={order.id} />

              <select
                name="status"
                defaultValue={order.status}
                className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
              >
                Сохранить статус
              </button>
            </form>
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Оплаты</h2>

            <div className="mt-5 grid gap-3 text-sm">
              <div>Предоплата: {getPaymentBooleanLabel(order.preorderPaid)}</div>
              <div>Постоплата: {getPaymentBooleanLabel(order.finalPaid)}</div>
              <div>Доставка: {getPaymentBooleanLabel(order.deliveryPaid)}</div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <form action={markPreorderPaidAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <button
                  type="submit"
                  className="w-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm transition hover:opacity-80"
                >
                  Отметить предоплату оплаченной
                </button>
              </form>

              <form action={markFinalPaidAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <button
                  type="submit"
                  className="w-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm transition hover:opacity-80"
                >
                  Отметить постоплату оплаченной
                </button>
              </form>

              <form action={markDeliveryPaidAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <button
                  type="submit"
                  className="w-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm transition hover:opacity-80"
                >
                  Отметить доставку оплаченной
                </button>
              </form>
            </div>
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Суммы и заметки</h2>

            <form action={updateOrderPricingAction} className="mt-5 flex flex-col gap-4">
              <input type="hidden" name="orderId" value={order.id} />

              <input
                name="finalPaymentAmount"
                type="number"
                defaultValue={order.finalPaymentAmount ?? undefined}
                placeholder="Сумма постоплаты"
                className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
              />

              <input
                name="deliveryPaymentAmount"
                type="number"
                defaultValue={order.deliveryPaymentAmount ?? undefined}
                placeholder="Сумма доставки"
                className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
              />

              <textarea
                name="adminNote"
                defaultValue={order.adminNote ?? ""}
                placeholder="Заметка администратора"
                className="min-h-28 border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
              />

              <button
                type="submit"
                className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
              >
                Сохранить суммы
              </button>
            </form>
          </section>

                    <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Отправка</h2>

            {order.trackNumber ? (
              <div className="mt-4 text-sm">
                Трек-номер: <b>{order.trackNumber}</b>
              </div>
            ) : (
              <form action={createCdekShipmentAction} className="mt-4">
                <input type="hidden" name="orderId" value={order.id} />

                <button
                  type="submit"
                  className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
                >
                  Создать отправление СДЭК
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
