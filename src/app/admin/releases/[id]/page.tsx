import Link from "next/link";
import { notFound } from "next/navigation";
import {
  closeReleaseDeliveryAction,
  closeReleaseFinalPaymentAction,
  closeReleasePreorderAction,
  openReleaseDeliveryAction,
  openReleasePreorderAction,
  updateReleaseFinalPaymentAction,
  updateReleaseInfoAction,
} from "@/modules/releases/server/actions";
import {
  getRelease,
  getReleaseOrderSummaries,
} from "@/modules/releases/server/service";
import {
  getReleasePaymentStageLabel,
  getReleaseStatusLabel,
  getReleaseStatusValue,
} from "@/modules/releases/utils";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function getOrdersStats(
  orders: {
    preorderPaid: boolean;
    finalPaid: boolean;
    deliveryPaid: boolean;
    booksCount: number;
  }[],
) {
  return {
    totalOrders: orders.length,
    totalBooks: orders.reduce((sum, order) => sum + order.booksCount, 0),
    preorderPaid: orders.filter((order) => order.preorderPaid).length,
    finalPaid: orders.filter((order) => order.finalPaid).length,
    deliveryPaid: orders.filter((order) => order.deliveryPaid).length,
  };
}

export default async function AdminReleaseDetailsPage({ params }: Props) {
  const { id } = await params;

  const [release, releaseOrders] = await Promise.all([
    getRelease(id),
    getReleaseOrderSummaries(id),
  ]);

  if (!release) {
    notFound();
  }

  const statusValue = getReleaseStatusValue(release);
  const statusLabel = getReleaseStatusLabel(statusValue);
  const stats = getOrdersStats(releaseOrders);
  const relatedBooks = release.products.filter((product) => product.type === "BOOK");
  const relatedMerch = release.products.filter((product) => product.type === "MERCH");

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">{release.title}</h1>
          <p className="text-[var(--muted-foreground)]">
            Релиз управляет этапами продаж и отображаемым статусом связанных товаров.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/products/new?releaseId=${release.id}`}
            className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            Добавить товар в релиз
          </Link>

          <a
            href={`/api/admin/releases/export?releaseId=${release.id}`}
            className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm transition hover:opacity-80"
          >
            Скачать список заказов
          </a>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-5">
        <div className="border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="text-sm text-[var(--muted-foreground)]">Статус релиза</div>
          <div className="mt-2 text-xl font-semibold">{statusLabel}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="text-sm text-[var(--muted-foreground)]">Заказов с книгами релиза</div>
          <div className="mt-2 text-2xl font-semibold">{stats.totalOrders}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="text-sm text-[var(--muted-foreground)]">Заказано книг</div>
          <div className="mt-2 text-2xl font-semibold">{stats.totalBooks}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="text-sm text-[var(--muted-foreground)]">Оплатили предоплату</div>
          <div className="mt-2 text-2xl font-semibold">{stats.preorderPaid}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="text-sm text-[var(--muted-foreground)]">Оплатили пост/доставку</div>
          <div className="mt-2 text-2xl font-semibold">
            {stats.finalPaid} / {stats.deliveryPaid}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Товары релиза</h2>
              <Link
                href={`/admin/products/new?releaseId=${release.id}`}
                className="text-sm underline underline-offset-4"
              >
                Добавить книгу или мерч
              </Link>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium">Книги</div>
                <div className="mt-3 flex flex-col gap-3">
                  {relatedBooks.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      В релиз ещё не добавлены книги.
                    </p>
                  ) : (
                    relatedBooks.map((product) => (
                      <Link
                        key={product.id}
                        href={`/admin/products/${product.id}`}
                        className="border border-[var(--border)] bg-transparent px-4 py-3 text-sm transition hover:opacity-80"
                      >
                        {product.title}
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Мерч</div>
                <div className="mt-3 flex flex-col gap-3">
                  {relatedMerch.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      В релиз ещё не добавлен мерч.
                    </p>
                  ) : (
                    relatedMerch.map((product) => (
                      <Link
                        key={product.id}
                        href={`/admin/products/${product.id}`}
                        className="border border-[var(--border)] bg-transparent px-4 py-3 text-sm transition hover:opacity-80"
                      >
                        {product.title}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Заказы релиза</h2>

            {releaseOrders.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                Заказов с книгами этого релиза пока нет.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                    <tr>
                      <th className="px-2 py-3">Заказ</th>
                      <th className="px-2 py-3">Пользователь</th>
                      <th className="px-2 py-3">Книги релиза</th>
                      <th className="px-2 py-3">Предоплата</th>
                      <th className="px-2 py-3">Постоплата</th>
                      <th className="px-2 py-3">Доставка</th>
                    </tr>
                  </thead>

                  <tbody>
                    {releaseOrders.map((order) => (
                      <tr key={order.id} className="border-b border-[var(--border)]">
                        <td className="px-2 py-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="underline underline-offset-4"
                          >
                            {order.id}
                          </Link>
                        </td>
                        <td className="px-2 py-3">
                          <div>{order.user.name}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {order.user.email}
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          {order.items.map((item) => (
                            <div key={`${order.id}-${item.productTitle}`}>
                              {item.productTitle} x{item.quantity}
                            </div>
                          ))}
                        </td>
                        <td className="px-2 py-3">{order.preorderPaid ? "Да" : "Нет"}</td>
                        <td className="px-2 py-3">{order.finalPaid ? "Да" : "Нет"}</td>
                        <td className="px-2 py-3">{order.deliveryPaid ? "Да" : "Нет"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Основная информация</h2>

            <form action={updateReleaseInfoAction} className="mt-5 flex flex-col gap-4">
              <input type="hidden" name="releaseId" value={release.id} />

              <input
                name="title"
                defaultValue={release.title}
                placeholder="Название релиза"
                className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
              />

              <input
                name="slug"
                defaultValue={release.slug}
                placeholder="Slug"
                className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
              />

              <input
                name="preorderPrice"
                type="number"
                defaultValue={release.preorderPrice}
                placeholder="Предоплата"
                className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
              />

              <button
                type="submit"
                className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
              >
                Сохранить релиз
              </button>
            </form>
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Этапы релиза</h2>

            <div className="mt-5 grid gap-3 text-sm">
              <div>
                <span className="text-[var(--muted-foreground)]">Предзаказ:</span>{" "}
                {getReleasePaymentStageLabel(release.preorderOpen, "Открыт")}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Постоплата:</span>{" "}
                {getReleasePaymentStageLabel(release.finalPaymentOpen, "Открыта")}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Оплата доставки:</span>{" "}
                {getReleasePaymentStageLabel(release.deliveryOpen, "Открыта")}
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Финальная цена:</span>{" "}
                {release.finalPrice ? `${release.finalPrice} ₽` : "ещё не задана"}
              </div>
            </div>
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Предзаказ</h2>

            {!release.preorderOpen ? (
              <form action={openReleasePreorderAction} className="mt-5">
                <input type="hidden" name="releaseId" value={release.id} />
                <button
                  type="submit"
                  className="w-full border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
                >
                  Открыть предзаказ
                </button>
              </form>
            ) : (
              <form action={closeReleasePreorderAction} className="mt-5">
                <input type="hidden" name="releaseId" value={release.id} />
                <button
                  type="submit"
                  className="w-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm transition hover:opacity-80"
                >
                  Закрыть предзаказ
                </button>
              </form>
            )}
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Постоплата</h2>

            <form action={updateReleaseFinalPaymentAction} className="mt-5 flex flex-col gap-4">
              <input type="hidden" name="releaseId" value={release.id} />

              <input
                name="finalPrice"
                type="number"
                defaultValue={release.finalPrice ?? undefined}
                placeholder="Финальная цена книги"
                className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
              />

              <button
                type="submit"
                className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
              >
                Сохранить цену и открыть постоплату
              </button>
            </form>

            {release.finalPaymentOpen ? (
              <form action={closeReleaseFinalPaymentAction} className="mt-3">
                <input type="hidden" name="releaseId" value={release.id} />
                <button
                  type="submit"
                  className="w-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm transition hover:opacity-80"
                >
                  Закрыть постоплату
                </button>
              </form>
            ) : null}
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Оплата доставки</h2>

            {!release.deliveryOpen ? (
              <form action={openReleaseDeliveryAction} className="mt-5">
                <input type="hidden" name="releaseId" value={release.id} />
                <button
                  type="submit"
                  className="w-full border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
                >
                  Открыть оплату доставки
                </button>
              </form>
            ) : (
              <form action={closeReleaseDeliveryAction} className="mt-5">
                <input type="hidden" name="releaseId" value={release.id} />
                <button
                  type="submit"
                  className="w-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm transition hover:opacity-80"
                >
                  Закрыть оплату доставки
                </button>
              </form>
            )}
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Подсказка</h2>
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Статус книг и мерча этого релиза в каталоге теперь определяется этапом
              релиза. Редактировать отдельные карточки товаров для переключения стадий
              больше не нужно.
            </p>
          </section>

          <section className="border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-medium">Рассылки</h2>
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Быстрые переходы к Telegram-рассылкам по этому релизу.
            </p>

            <div className="mt-5 grid gap-3">
              <Link
                href={`/admin/mailings?target=release&releaseId=${release.id}&template=announce`}
                className="border border-[var(--border)] px-4 py-3 text-sm transition hover:opacity-80"
              >
                Отправить анонс релиза
              </Link>

              <Link
                href={`/admin/mailings?target=release&releaseId=${release.id}&template=preorder-reminder`}
                className="border border-[var(--border)] px-4 py-3 text-sm transition hover:opacity-80"
              >
                Напомнить о предзаказе
              </Link>

              <Link
                href={`/admin/mailings?target=release&releaseId=${release.id}&template=final-payment`}
                className="border border-[var(--border)] px-4 py-3 text-sm transition hover:opacity-80"
              >
                Сообщить об открытии постоплаты
              </Link>

              <Link
                href={`/admin/mailings?target=release&releaseId=${release.id}&template=delivery`}
                className="border border-[var(--border)] px-4 py-3 text-sm transition hover:opacity-80"
              >
                Сообщить об открытии доставки
              </Link>

              <Link
                href={`/admin/mailings?target=release-final-unpaid&releaseId=${release.id}&template=final-unpaid`}
                className="border border-[var(--border)] px-4 py-3 text-sm transition hover:opacity-80"
              >
                Напомнить о постоплате
              </Link>

              <Link
                href={`/admin/mailings?target=release-delivery-unpaid&releaseId=${release.id}&template=delivery-unpaid`}
                className="border border-[var(--border)] px-4 py-3 text-sm transition hover:opacity-80"
              >
                Напомнить об оплате доставки
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
