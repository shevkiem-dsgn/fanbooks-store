import type { ReactNode } from "react";
import Link from "next/link";
import { getAnalyticsOverview } from "@/modules/analytics/server/service";

function ToneBadge({
  tone,
  children,
}: {
  tone: "neutral" | "warning" | "success";
  children: ReactNode;
}) {
  const className =
    tone === "warning"
      ? "border-amber-300/60 bg-amber-100/50 text-amber-900"
      : tone === "success"
        ? "border-emerald-300/60 bg-emerald-100/50 text-emerald-900"
        : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]";

  return (
    <span className={`inline-flex w-fit border px-2 py-1 text-xs ${className}`}>
      {children}
    </span>
  );
}

function TrendBars({
  title,
  data,
  dataKey,
  suffix = "",
}: {
  title: string;
  data: { date: string; orders: number; revenue: number }[];
  dataKey: "orders" | "revenue";
  suffix?: string;
}) {
  const maxValue = Math.max(...data.map((item) => item[dataKey]), 1);

  return (
    <section className="border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="text-lg font-medium">{title}</h2>

      <div className="mt-5 flex items-end gap-3 overflow-x-auto">
        {data.map((item) => {
          const value = item[dataKey];
          const height = `${Math.max((value / maxValue) * 160, value > 0 ? 10 : 4)}px`;

          return (
            <div
              key={`${title}-${item.date}`}
              className="flex min-w-[42px] flex-col items-center gap-2"
            >
              <div className="text-xs text-[var(--muted-foreground)]">
                {value}
                {suffix}
              </div>
              <div
                className="w-8 border border-[var(--border)] bg-[var(--foreground)]"
                style={{ height }}
              />
              <div className="text-xs text-[var(--muted-foreground)]">{item.date}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type SearchParams = Promise<{
  period?: string;
}>;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const period = Number(params.period || 14);
  const allowedPeriods = [7, 14, 30, 90];
  const periodDays = allowedPeriods.includes(period) ? period : 14;

  const analytics = await getAnalyticsOverview(periodDays);

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">Аналитика</h1>
          <p className="max-w-3xl text-[var(--muted-foreground)]">
            Здесь только те показатели, которые помогают управлять релизами,
            деньгами и очередью отправок.
          </p>
        </div>

        <a
          href={`/api/admin/analytics/export?period=${periodDays}`}
          className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
        >
          Скачать аналитический отчёт
        </a>
      </div>

      <section className="mt-8 flex flex-wrap gap-3">
        {allowedPeriods.map((value) => (
          <Link
            key={value}
            href={`/admin/analytics?period=${value}`}
            className={`border px-4 py-2 text-sm transition ${
              periodDays === value
                ? "border-transparent bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "border-[var(--border)] bg-[var(--card)] hover:opacity-80"
            }`}
          >
            {value} дней
          </Link>
        ))}
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Книг заказано</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.totals.totalBooksOrdered}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Заказов</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.totals.totalOrders}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Ждут отправку</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.totals.readyToShipCount}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Релизы с риском</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.totals.releasesNeedAttention}</div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Что требует внимания</h2>
            <span className="text-sm text-[var(--muted-foreground)]">
              {analytics.actionItems.length === 0 ? "Всё под контролем" : `${analytics.actionItems.length} задач`}
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {analytics.actionItems.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Сейчас нет срочных действий. Можно спокойно работать с релизами и отправками.
              </p>
            ) : (
              analytics.actionItems.map((item) => (
                <div key={item.id} className="border border-[var(--border)] bg-transparent p-4">
                  <ToneBadge tone={item.tone}>
                    {item.tone === "warning" ? "Нужно действие" : "Следующий шаг"}
                  </ToneBadge>
                  <div className="mt-3 font-medium">{item.title}</div>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-3 inline-block text-sm underline underline-offset-4"
                  >
                    Открыть
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-medium">Деньги по этапам</h2>

          <div className="mt-5 grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Собрано всего</span>
              <span className="font-medium">{analytics.money.totalRevenue} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Предоплаты</span>
              <span className="font-medium">{analytics.money.preorderCollected} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Постоплаты</span>
              <span className="font-medium">{analytics.money.finalCollected} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Доставка</span>
              <span className="font-medium">{analytics.money.deliveryCollected} ₽</span>
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

      <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Выручка за период</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.money.revenueInPeriod} ₽</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Средний чек</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.money.averageOrderValue} ₽</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Выручка книг</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.money.booksRevenue} ₽</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Выручка мерча</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.money.merchRevenue} ₽</div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 xl:grid-cols-2">
        <TrendBars
          title={`Заказы за ${analytics.periodDays} дней`}
          data={analytics.dailyStats}
          dataKey="orders"
        />
        <TrendBars
          title={`Поступления за ${analytics.periodDays} дней`}
          data={analytics.dailyStats}
          dataKey="revenue"
          suffix="₽"
        />
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-medium">Релизы</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Здесь видно, что можно печатать, а где ещё не добран тираж.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto border border-[var(--border)] bg-[var(--card)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Релиз</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Книг</th>
                <th className="px-4 py-3">Мин. тираж</th>
                <th className="px-4 py-3">Не хватает</th>
                <th className="px-4 py-3">Собрано</th>
                <th className="px-4 py-3">Отказы</th>
                <th className="px-4 py-3">Что делать</th>
              </tr>
            </thead>

            <tbody>
              {analytics.releaseStats.map((release) => (
                <tr key={release.id} className="border-b border-[var(--border)] align-top">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/analytics/releases/${release.id}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {release.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{release.statusLabel}</td>
                  <td className="px-4 py-3">{release.booksOrdered}</td>
                  <td className="px-4 py-3">{release.minPrintRun || "—"}</td>
                  <td className="px-4 py-3">
                    {release.minPrintRun > 0 ? release.remainingToMinPrintRun : "—"}
                  </td>
                  <td className="px-4 py-3">{release.collectedRevenue} ₽</td>
                  <td className="px-4 py-3">{release.droppedAfterPreorder}</td>
                  <td className="px-4 py-3">
                    <ToneBadge tone={release.actionTone}>{release.actionLabel}</ToneBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
