import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveOrderDeliveryPointAction } from "@/modules/orders/server/actions";
import { getOrderStatusLabel } from "@/modules/orders/utils";
import { PaymentButton } from "@/modules/payments/ui/payment-button";
import { CdekOfficeSelect } from "@/modules/shipping/cdek/ui/office-select";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailsPage({ params }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              release: true,
            },
          },
        },
      },
      delivery: true,
      payments: true,
    },
  });

  if (!order) {
    notFound();
  }

  const initialAmount = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const releasePostpayments = new Map<
    string,
    {
      title: string;
      amount: number;
      isOpen: boolean;
    }
  >();

  for (const item of order.items) {
    if (item.product.type !== "BOOK") continue;
    if (item.product.paymentMode === "FULL_PAYMENT") continue;
    if (!item.product.release) continue;

    const release = item.product.release;

    if (releasePostpayments.has(release.id)) continue;

    const amount = Math.max(
      0,
      (release.finalPrice ?? 0) - release.preorderPrice,
    );

    releasePostpayments.set(release.id, {
      title: release.title,
      amount,
      isOpen: release.finalPaymentOpen,
    });
  }

  const finalAmount = Array.from(releasePostpayments.values())
    .filter((release) => release.isOpen)
    .reduce((sum, release) => sum + release.amount, 0);

  const hasClosedPostpayment = Array.from(releasePostpayments.values()).some(
    (release) => !release.isOpen,
  );
  const deliveryLockedByRelease = order.items.some(
    (item) =>
      item.product.type === "BOOK" &&
      item.product.release &&
      !item.product.release.deliveryOpen,
  );

  const deliveryAmount = order.deliveryPaymentAmount ?? 0;
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Заказ {order.id}</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
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
        </div>

        <aside className="flex flex-col gap-6">
          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Информация</h2>
            <section className="border border-[var(--border)] bg-[var(--card)] p-6">
  <h2 className="text-lg font-medium">Статус оплаты</h2>

  <div className="mt-5 flex flex-col gap-3 text-sm">
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
      <span>Предоплата</span>
      <span className={order.preorderPaid ? "text-green-600" : "text-[var(--muted-foreground)]"}>
        {order.preorderPaid ? "Оплачена" : "Не оплачена"}
      </span>
    </div>

    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
      <span>Постоплата</span>
      <span className={order.finalPaid ? "text-green-600" : "text-[var(--muted-foreground)]"}>
        {order.finalPaid ? "Оплачена" : "Не оплачена"}
      </span>
    </div>

    <div className="flex items-center justify-between">
      <span>Доставка</span>
      <span className={order.deliveryPaid ? "text-green-600" : "text-[var(--muted-foreground)]"}>
        {order.deliveryPaid ? "Оплачена" : "Не оплачена"}
      </span>
    </div>
  </div>
</section>

            <div className="mt-5 flex flex-col gap-3 text-sm">
              <div>
                <span className="text-[var(--muted-foreground)]">Статус:</span>{" "}
                {getOrderStatusLabel(order.status)}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Получатель:</span>{" "}
                {order.recipientName || "—"}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Телефон:</span>{" "}
                {order.recipientPhone || "—"}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Email:</span>{" "}
                {order.recipientEmail || "—"}
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
                <span className="text-[var(--muted-foreground)]">ПВЗ СДЭК:</span>{" "}
                {order.cdekPvzCode ? `${order.cdekPvzCode} • ${order.city || ""}` : "—"}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Трек:</span>{" "}
                {order.trackNumber || order.delivery?.trackNumber || "ещё не добавлен"}
              </div>
            </div>
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Оплата</h2>

            <div className="mt-5 flex flex-col gap-4">
              {!order.preorderPaid ? (
                <>
                  <PaymentButton
                    orderId={order.id}
                    paymentKind="initial"
                    label="Оплатить заказ"
                    amount={initialAmount}
                  />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Первый платёж включает предоплату за книги и полную стоимость мерча / отказных экземпляров.
                  </p>
                </>
              ) : null}

              {order.preorderPaid && !order.finalPaid ? (
                <>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="font-medium">Постоплата по книгам</div>

                    {releasePostpayments.size === 0 ? (
                      <p className="text-[var(--muted-foreground)]">
                        В этом заказе нет книг с постоплатой.
                      </p>
                    ) : (
                      Array.from(releasePostpayments.values()).map((release) => (
                        <div key={release.title} className="flex items-center justify-between">
                          <span>{release.title}</span>
                          <span>
                            {release.isOpen
                              ? `${release.amount} ₽`
                              : "ещё не открыта"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {finalAmount > 0 ? (
                    <PaymentButton
                      orderId={order.id}
                      paymentKind="final"
                      label="Оплатить постоплату"
                      amount={finalAmount}
                    />
                  ) : null}

                  {hasClosedPostpayment ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Постоплата для части книг ещё не открыта администратором.
                    </p>
                  ) : null}
                </>
              ) : null}

              {order.finalPaid && !order.deliveryPaid ? (
                <>
                  {deliveryLockedByRelease ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Оплата доставки для книг в этом заказе ещё не открыта.
                    </p>
                  ) : (
                    <>
                      <form action={saveOrderDeliveryPointAction} className="grid gap-4">
                        <input type="hidden" name="orderId" value={order.id} />

                        <CdekOfficeSelect
                          initialOffice={
                            order.cdekPvzCode && order.city && order.address
                              ? {
                                  code: order.cdekPvzCode,
                                  city: order.city,
                                  address: order.address,
                                }
                              : undefined
                          }
                        />

                        <button
                          type="submit"
                          className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm transition hover:opacity-80"
                        >
                          {order.cdekPvzCode
                            ? "Обновить ПВЗ и пересчитать доставку"
                            : "Выбрать ПВЗ и рассчитать доставку"}
                        </button>
                      </form>

                      {deliveryAmount > 0 ? (
                        <>
                          <div className="rounded-none border border-[var(--border)] bg-[var(--muted)] p-4 text-sm">
                            <div className="font-medium">
                              Доставка рассчитана: {deliveryAmount} ₽
                            </div>
                            <div className="mt-2 text-[var(--muted-foreground)]">
                              ПВЗ: {order.cdekPvzCode} • {order.address}
                            </div>
                          </div>

                          <PaymentButton
                            orderId={order.id}
                            paymentKind="delivery"
                            label="Оплатить доставку"
                            amount={deliveryAmount}
                            description={`Тестовая оплата доставки по заказу ${order.id}`}
                          />
                        </>
                      ) : (
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Сначала выбери ПВЗ, чтобы рассчитать доставку и перейти к оплате.
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : null}

              {order.preorderPaid && order.finalPaid && order.deliveryPaid ? (
                <div className="grid gap-3 text-sm text-[var(--muted-foreground)]">
                  <p>Все этапы оплаты уже завершены.</p>
                  {order.trackNumber ? (
                    <p>
                      Трек-номер для отслеживания:{" "}
                      <span className="font-medium text-[var(--foreground)]">
                        {order.trackNumber}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
