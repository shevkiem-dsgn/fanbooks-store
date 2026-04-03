import { notFound } from "next/navigation";
import { getReleaseAnalytics } from "@/modules/analytics/server/service";

function StageBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = max > 0 ? `${(value / max) * 100}%` : "0%";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-[var(--muted-foreground)]">{value}</span>
      </div>

      <div className="h-3 border border-[var(--border)] bg-[var(--card)]">
        <div className="h-full bg-[var(--foreground)]" style={{ width }} />
      </div>
    </div>
  );
}

export default async function AdminReleaseAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analytics = await getReleaseAnalytics(id);

  if (!analytics) {
    notFound();
  }

  const maxStage = Math.max(analytics.funnel.totalOrders, 1);

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">{analytics.release.title}</h1>
          <p className="text-[var(--muted-foreground)]">
            Понятная сводка по тиражу, деньгам и следующему шагу для этого релиза.
          </p>
        </div>

        <a
          href={`/api/admin/analytics/releases/${analytics.release.id}/export`}
          className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
        >
          Скачать отчёт по релизу
        </a>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Статус релиза</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.release.status}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Заказано книг</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.focus.booksOrdered}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Минимальный тираж</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.focus.minPrintRun || "—"}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">До печати осталось</div>
          <div className="mt-2 text-3xl font-semibold">
            {analytics.focus.minPrintRun > 0 ? analytics.focus.remainingToMinPrintRun : "—"}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-medium">Что это значит</h2>

          <div className="mt-5 grid gap-4">
            <div className="border border-[var(--border)] bg-transparent p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Тираж</div>
              <div className="mt-2 font-medium">
                {analytics.focus.canPrint
                  ? "Минимальный тираж уже набран"
                  : `До печати не хватает ещё ${analytics.focus.remainingToMinPrintRun} книг`}
              </div>
            </div>

            <div className="border border-[var(--border)] bg-transparent p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Оплаты</div>
              <div className="mt-2 font-medium">
                {analytics.focus.waitingFinal > 0
                  ? `${analytics.focus.waitingFinal} заказов ждут постоплату`
                  : "По постоплате критичных хвостов нет"}
              </div>
            </div>

            <div className="border border-[var(--border)] bg-transparent p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Отказы</div>
              <div className="mt-2 font-medium">
                После предоплаты отвалилось: {analytics.focus.droppedAfterPreorder}
              </div>
            </div>

            <div className="border border-[var(--border)] bg-transparent p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Отправка</div>
              <div className="mt-2 font-medium">
                {analytics.focus.waitingShipment > 0
                  ? `${analytics.focus.waitingShipment} заказов уже готовы к отправке`
                  : "Очередь на отправку пока небольшая"}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-medium">Деньги по релизу</h2>

          <div className="mt-5 grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Собрано всего</span>
              <span className="font-medium">{analytics.money.collectedRevenue} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Предоплата за книгу</span>
              <span className="font-medium">{analytics.money.preorderAmountPerBook} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Остаток по книге</span>
              <span className="font-medium">{analytics.money.finalAmountPerBook} ₽</span>
            </div>
            <div className="h-px bg-[var(--border)]" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Ещё ждём по постоплатам</span>
              <span className="font-medium">{analytics.money.expectedFinalRevenue} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Ещё ждём по доставке</span>
              <span className="font-medium">{analytics.money.expectedDeliveryRevenue} ₽</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Заказов</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.funnel.totalOrders}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Предоплата</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.funnel.preorderPaid}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Постоплата</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.funnel.finalPaid}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Доставка</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.funnel.deliveryPaid}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Отправлено</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.funnel.shipped}</div>
        </div>
      </section>

      <section className="mt-12 border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">Воронка релиза</h2>

        <div className="mt-5 grid gap-5">
          <StageBar label="Создано заказов" value={analytics.funnel.totalOrders} max={maxStage} />
          <StageBar label="Оплатили предоплату" value={analytics.funnel.preorderPaid} max={maxStage} />
          <StageBar label="Оплатили постоплату" value={analytics.funnel.finalPaid} max={maxStage} />
          <StageBar label="Оплатили доставку" value={analytics.funnel.deliveryPaid} max={maxStage} />
          <StageBar label="Отправлены" value={analytics.funnel.shipped} max={maxStage} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Товары релиза</h2>

        <div className="mt-4 overflow-x-auto border border-[var(--border)] bg-[var(--card)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Товар</th>
                <th className="px-4 py-3">Тип</th>
                <th className="px-4 py-3">Продано</th>
                <th className="px-4 py-3">Выручка</th>
              </tr>
            </thead>

            <tbody>
              {analytics.products.map((product) => (
                <tr key={product.id} className="border-b border-[var(--border)]">
                  <td className="px-4 py-3">{product.title}</td>
                  <td className="px-4 py-3">{product.type === "BOOK" ? "Книга" : "Мерч"}</td>
                  <td className="px-4 py-3">{product.soldUnits}</td>
                  <td className="px-4 py-3">{product.revenue} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Заказы релиза</h2>

        <div className="mt-4 overflow-x-auto border border-[var(--border)] bg-[var(--card)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Заказ</th>
                <th className="px-4 py-3">Пользователь</th>
                <th className="px-4 py-3">Книг</th>
                <th className="px-4 py-3">Оплачено</th>
                <th className="px-4 py-3">Следующий шаг</th>
              </tr>
            </thead>

            <tbody>
              {analytics.orderRows.map((order) => (
                <tr key={order.id} className="border-b border-[var(--border)]">
                  <td className="px-4 py-3">{order.id}</td>
                  <td className="px-4 py-3">
                    <div>{order.userName}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {order.userEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3">{order.booksCount}</td>
                  <td className="px-4 py-3">{order.totalPaid} ₽</td>
                  <td className="px-4 py-3">{order.nextStep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
