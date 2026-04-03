"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function CatalogSearch({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set("search", value.trim());
      } else {
        params.delete("search");
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="flex w-full flex-col gap-2">
  <input
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="Поиск: название, автор, фандом..."
    className="w-full border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
  />

      {/* <div className="text-xs text-[var(--muted-foreground)]">
        {isPending ? "Ищем..." : "Поиск обновляется автоматически"}
      </div> */}
    </div>
  );
}