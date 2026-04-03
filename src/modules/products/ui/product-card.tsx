import Link from "next/link";
import { Product, ProductImage, Release } from "@prisma/client";
import { getProductDisplayStatusLabel, getProductTypeLabel } from "@/modules/products/utils";

type ProductWithImages = Product & {
  images: ProductImage[];
  release: Release | null;
};

type Props = {
  product: ProductWithImages;
};

export function ProductCard({ product }: Props) {
  const cover =
    product.images.find((image) => image.isCover) ?? product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group overflow-hidden border border-[var(--border)] bg-[var(--card)] transition hover:opacity-95"
    >
      <div className="aspect-[3/4] w-full overflow-hidden bg-[var(--muted)]">
        {cover ? (
          <img
            src={cover.imageUrl}
            alt={cover.altText ?? product.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
            Нет изображения
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted-foreground)]">
            {getProductTypeLabel(product.type)}
          </span>

          <span className="text-xs text-[var(--muted-foreground)]">
            {getProductDisplayStatusLabel(product)}
          </span>
        </div>

        <h3 className="line-clamp-2 text-lg font-medium">{product.title}</h3>

        <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">
          {product.description}
        </p>

        <div className="pt-2 text-sm font-medium">
          {product.finalPrice ? `${product.finalPrice} ₽` : "Цена уточняется"}
        </div>
      </div>
    </Link>
  );
}
