import { prisma } from "@/lib/prisma";

export default async function AdminExportsPage() {
  const releases = await prisma.release.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Экспорт таблиц</h1>
        <p className="text-[var(--muted-foreground)]">
          Выбери релиз и скачай таблицу заказов.
        </p>
      </div>

      <div className="mt-10 border border-[var(--border)] bg-[var(--card)] p-6">
        <form className="flex flex-col gap-4" action="/api/admin/releases/export" method="GET">
          <select
            name="releaseId"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              Выбери релиз
            </option>

            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.title}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="w-fit border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            Скачать таблицу заказов
          </button>
        </form>
      </div>
    </main>
  );
}