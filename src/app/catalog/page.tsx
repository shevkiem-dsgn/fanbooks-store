import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CatalogSearch } from "@/modules/products/ui/catalog-search";
import { getProductDisplayStatusLabel } from "@/modules/products/utils";

type SearchParams = Promise<{
  search?: string;
}>;

type ProductCard = {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  fandom: string | null;
  statusLabel: string;
  images: {
    imageUrl: string;
    isCover: boolean;
  }[];
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = params.search?.trim() || "";

  const allProducts = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      release: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const normalizedSearch = search.toLowerCase();

  const products: ProductCard[] = allProducts
    .filter((product) => {
      if (!normalizedSearch) return true;

      return [
        product.title,
        product.author ?? "",
        product.fandom ?? "",
        product.tags ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    })
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      author: product.author,
      fandom: product.fandom,
      statusLabel: getProductDisplayStatusLabel(product),
      images: product.images.map((image) => ({
        imageUrl: image.imageUrl,
        isCover: image.isCover,
      })),
    }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold">Каталог</h1>
        <CatalogSearch initialValue={search} />
      </div>

      <section className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">Ничего не найдено.</p>
        ) : (
          products.map((product) => {
            const cover =
              product.images.find((img: { imageUrl: string; isCover: boolean }) => img.isCover) ??
              product.images[0];

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="border border-[var(--border)] bg-[var(--card)] transition hover:opacity-80"
              >
                {cover ? (
                  <img
                    src={cover.imageUrl}
                    alt={product.title}
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[3/4] w-full bg-[var(--border)]" />
                )}

                <div className="flex flex-col gap-2 p-4">
                  <h3 className="text-lg font-medium">{product.title}</h3>

                  {product.author ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {product.author}
                    </p>
                  ) : null}

                  {product.fandom ? (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {product.fandom}
                    </p>
                  ) : null}

                  <p className="text-xs text-[var(--muted-foreground)]">
                    {product.statusLabel}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
