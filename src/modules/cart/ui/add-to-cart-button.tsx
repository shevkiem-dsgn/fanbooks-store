"use client";

import { useState } from "react";
import { useCartStore } from "@/modules/cart/store";
import { getReleaseStatusLabel, getReleaseStatusValue } from "@/modules/releases/utils";

type Props = {
  product: {
    id: string;
    slug: string;
    title: string;
    type: "BOOK" | "MERCH";
    finalPrice: number | null;
    releaseId?: string | null;
    release?: {
      status: string;
      preorderOpen: boolean;
      finalPaymentOpen: boolean;
      deliveryOpen: boolean;
      finalPrice: number | null;
    } | null;
    images: {
      imageUrl: string;
      isCover: boolean;
    }[];
  };
};

export function AddToCartButton({ product }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const [added, setAdded] = useState(false);

  const cover =
    product.images.find((image) => image.isCover) ?? product.images[0];

  const alreadyInCart =
    product.type === "BOOK" &&
    items.some((item) => item.productId === product.id);
  const releaseStatusLabel = product.release
    ? getReleaseStatusLabel(getReleaseStatusValue(product.release))
    : null;
  const preorderClosedForBook =
    product.type === "BOOK" && product.release ? !product.release.preorderOpen : false;

  const handleAdd = () => {
    if (alreadyInCart || preorderClosedForBook) return;

    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      type: product.type,
      price:
  product.type === "BOOK"
    ? null
    : product.finalPrice ?? null,
      imageUrl: cover?.imageUrl ?? null,
      quantity: 1,
      releaseId: product.releaseId ?? null,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1200);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={alreadyInCart || preorderClosedForBook}
      className="mt-2 border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-50"
    >
      {alreadyInCart
        ? "Книга уже в корзине"
        : preorderClosedForBook
          ? `Сейчас недоступно: ${releaseStatusLabel}`
          : added
            ? "Добавлено"
            : "Добавить в корзину"}
    </button>
  );
}
