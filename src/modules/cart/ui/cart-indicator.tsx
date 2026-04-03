"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/modules/cart/store";

export function CartIndicator() {
  const items = useCartStore((state) => state.items);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/cart"
      className="relative inline-flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition hover:opacity-80"
      aria-label="Корзина"
    >
      <ShoppingBag size={18} />
      {totalCount > 0 ? (
        <span className="absolute -right-2 -top-2 min-w-5 border border-[var(--border)] bg-[var(--background)] px-1 text-center text-[10px] leading-5">
          {totalCount}
        </span>
      ) : null}
    </Link>
  );
}