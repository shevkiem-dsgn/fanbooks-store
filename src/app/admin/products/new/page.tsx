import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/modules/products/ui/product-form";
import { createProductAction } from "@/modules/products/server/actions";

type SearchParams = Promise<{
  releaseId?: string;
}>;

export default async function AdminNewProductPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
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
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Создать товар</h1>
        <p className="text-[var(--muted-foreground)]">
          Добавление новой книги или мерча.
        </p>
      </div>

      <div className="mt-10">
        <ProductForm
          mode="create"
          action={createProductAction}
          releases={releases}
          initialReleaseId={params.releaseId}
        />
      </div>
    </main>
  );
}
