import { getAnalyticsOverview } from "@/modules/analytics/server/service";

export default async function AdminAnalyticsPage() {
  const analytics = await getAnalyticsOverview();

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Аналитика</h1>
        <p className="text-[var(--muted-foreground)]">
          Основные показатели проекта и релизов.
        </p>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Всего заказов</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.totals.totalOrders}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Пользователей</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.totals.totalUsers}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Товаров</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.totals.totalProducts}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Выручка</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.money.totalRevenue} ₽</div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Книг заказано</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.totals.totalBooksOrdered}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Готовы к отправке</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.totals.readyToShipCount}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Релизов требуют внимания</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.totals.releasesNeedAttention}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Отправлено</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.totals.shippedCount}</div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium">Релизы</h2>

        <div className="mt-4 overflow-x-auto border border-[var(--border)] bg-[var(--card)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Релиз</th>
                <th className="px-4 py-3">Заказов</th>
                <th className="px-4 py-3">Предоплата</th>
                <th className="px-4 py-3">Постоплата</th>
                <th className="px-4 py-3">Доставка</th>
                <th className="px-4 py-3">Конверсия 1 этап</th>
                <th className="px-4 py-3">Конверсия 2 этап</th>
                <th className="px-4 py-3">Конверсия доставки</th>
              </tr>
            </thead>
            <tbody>
              {analytics.releaseStats.map((release) => (
                <tr key={release.id} className="border-b border-[var(--border)]">
                  <td className="px-4 py-3">{release.title}</td>
                  <td className="px-4 py-3">{release.totalOrders}</td>
                  <td className="px-4 py-3">{release.preorderPaid}</td>
                  <td className="px-4 py-3">{release.finalPaid}</td>
                  <td className="px-4 py-3">{release.deliveryPaid}</td>
                  <td className="px-4 py-3">{release.preorderConversion}%</td>
                  <td className="px-4 py-3">{release.finalConversion}%</td>
                  <td className="px-4 py-3">{release.deliveryConversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium">Что требует внимания</h2>

        <div className="mt-4 grid gap-4">
          {analytics.actionItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
            >
              <div className="text-sm text-[var(--muted-foreground)]">
                {item.tone === "warning" ? "Нужно действие" : "Напоминание"}
              </div>
              <div className="mt-2 text-lg font-medium">{item.title}</div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{item.description}</p>
            </a>
          ))}

          {analytics.actionItems.length === 0 ? (
            <div className="border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted-foreground)]">
              Сейчас нет срочных задач по релизам.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
