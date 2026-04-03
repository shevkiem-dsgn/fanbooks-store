import { notFound } from "next/navigation";
import { getProductBySlug } from "@/modules/products/server/service";
import { AddToCartButton } from "@/modules/cart/ui/add-to-cart-button";
import { ProductGallery } from "@/modules/products/ui/product-gallery";
import {
  getProductDisplayStatusLabel,
  getProductTypeLabel,
} from "@/modules/products/utils";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <ProductGallery
          title={product.title}
          images={product.images.map((image) => ({
            imageUrl: image.imageUrl,
            altText: image.altText,
            isCover: image.isCover,
          }))}
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted-foreground)]">
              {getProductTypeLabel(product.type)}
            </span>

            <span className="border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted-foreground)]">
              {getProductDisplayStatusLabel(product)}
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            {product.title}
          </h1>

          <p className="text-[var(--muted-foreground)]">{product.description}</p>

          <div className="grid gap-2 text-sm text-[var(--muted-foreground)]">
            {product.fandom && (
              <div>
                <span className="text-[var(--foreground)]">Фандом:</span>{" "}
                {product.fandom}
              </div>
            )}
            {product.author && (
              <div>
                <span className="text-[var(--foreground)]">Автор:</span>{" "}
                {product.author}
              </div>
            )}
            {product.betaOrTranslator && (
              <div>
                <span className="text-[var(--foreground)]">
                  Бета / переводчик:
                </span>{" "}
                {product.betaOrTranslator}
              </div>
            )}
            {product.pairing && (
              <div>
                <span className="text-[var(--foreground)]">Пейринг:</span>{" "}
                {product.pairing}
              </div>
            )}
            {product.rating && (
              <div>
                <span className="text-[var(--foreground)]">Рейтинг:</span>{" "}
                {product.rating}
              </div>
            )}
            {product.tags && (
              <div>
                <span className="text-[var(--foreground)]">Метки:</span>{" "}
                {product.tags}
              </div>
            )}
            {product.pagesCount && (
              <div>
                <span className="text-[var(--foreground)]">Страниц:</span>{" "}
                {product.pagesCount}
              </div>
            )}
            {product.tomesCount && (
              <div>
                <span className="text-[var(--foreground)]">Томов:</span>{" "}
                {product.tomesCount}
              </div>
            )}
          </div>

          <div className="pt-3 text-2xl font-semibold">
            {product.finalPrice ? `${product.finalPrice} ₽` : "Цена уточняется"}
          </div>

          <AddToCartButton
            product={{
              id: product.id,
              slug: product.slug,
              title: product.title,
              type: product.type,
              finalPrice: product.finalPrice,
              releaseId: product.releaseId,
              release: product.release
                ? {
                    status: product.release.status,
                    preorderOpen: product.release.preorderOpen,
                    finalPaymentOpen: product.release.finalPaymentOpen,
                    deliveryOpen: product.release.deliveryOpen,
                    finalPrice: product.release.finalPrice,
                  }
                : null,
              images: product.images.map((image) => ({
                imageUrl: image.imageUrl,
                isCover: image.isCover,
              })),
            }}
          />
        </div>
      </div>
    </main>
  );
}
