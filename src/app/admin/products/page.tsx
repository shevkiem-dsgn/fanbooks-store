import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getProductDisplayStatusLabel,
  getProductTypeLabel,
} from "@/modules/products/utils";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      release: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">Товары</h1>
          <p className="text-[var(--muted-foreground)]">
            Управление книгами и мерчем.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
        >
          Создать товар
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto border border-[var(--border)] bg-[var(--card)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Активен</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-[var(--border)] transition hover:bg-[var(--muted)]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="underline underline-offset-4"
                  >
                    {product.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{getProductTypeLabel(product.type)}</td>
                <td className="px-4 py-3">{getProductDisplayStatusLabel(product)}</td>
                <td className="px-4 py-3">{product.isActive ? "Да" : "Нет"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
