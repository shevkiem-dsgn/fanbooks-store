import Link from "next/link";
import { getReleases } from "@/modules/releases/server/service";
import { getReleaseStatusLabel, getReleaseStatusValue } from "@/modules/releases/utils";

export default async function AdminReleasesPage() {
  const releases = await getReleases();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Релизы</h1>

        <Link
          href="/admin/releases/new"
          className="border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm transition hover:opacity-80"
        >
          Создать релиз
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {releases.map((release) => (
          <div
            key={release.id}
            className="border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{release.title}</div>

                <div className="text-sm text-[var(--muted-foreground)]">
                  статус: {getReleaseStatusLabel(getReleaseStatusValue(release))}
                  {" · "}предзаказ: {release.preorderOpen ? "открыт" : "закрыт"}
                  {" · "}постоплата: {release.finalPaymentOpen ? "открыта" : "закрыта"}
                  {" · "}доставка: {release.deliveryOpen ? "открыта" : "закрыта"}
                </div>
              </div>

              <Link
                href={`/admin/releases/${release.id}`}
                className="border border-[var(--border)] px-4 py-2 text-sm transition hover:opacity-80"
              >
                Управлять
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
