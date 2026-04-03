import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/modules/products/ui/product-form";
import {
  deactivateProductAction,
  updateProductAction,
} from "@/modules/products/server/actions";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminProductDetailsPage({ params }: Props) {
  const { id } = await params;

  const [product, releases] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    }),
    prisma.release.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">{product.title}</h1>
          <p className="text-[var(--muted-foreground)]">
            Полное редактирование карточки товара.
          </p>
        </div>

        <form action={deactivateProductAction}>
          <input type="hidden" name="productId" value={product.id} />
          <button
            type="submit"
            className="border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm transition hover:opacity-80"
          >
            Деактивировать товар
          </button>
        </form>
      </div>

      <div className="mt-10">
        <ProductForm
          mode="edit"
          action={updateProductAction}
          product={product}
          releases={releases}
        />
      </div>
    </main>
  );
}