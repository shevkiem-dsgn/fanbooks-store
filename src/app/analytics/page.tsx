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
          <div className="mt-2 text-3xl font-semibold">{analytics.totalOrders}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Пользователей</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.totalUsers}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Товаров</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.totalProducts}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Выручка</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.totalRevenue} ₽</div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Оплатили первый этап</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.preorderPaidCount}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Оплатили постоплату</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.finalPaidCount}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Оплатили доставку</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.deliveryPaidCount}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm text-[var(--muted-foreground)]">Отправлено</div>
          <div className="mt-2 text-2xl font-semibold">{analytics.shippedCount}</div>
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
                  <td className="px-4 py-3">{release.total}</td>
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
        <h2 className="text-xl font-medium">Популярные товары</h2>

        <div className="mt-4 overflow-x-auto border border-[var(--border)] bg-[var(--card)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Товар</th>
                <th className="px-4 py-3">Тип</th>
                <th className="px-4 py-3">Релиз</th>
                <th className="px-4 py-3">Продано единиц</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topProducts.map((product) => (
                <tr key={product.id} className="border-b border-[var(--border)]">
                  <td className="px-4 py-3">{product.title}</td>
                  <td className="px-4 py-3">{product.type === "BOOK" ? "Книга" : "Мерч"}</td>
                  <td className="px-4 py-3">{product.releaseTitle}</td>
                  <td className="px-4 py-3">{product.soldUnits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}