"use client";

import { useActionState } from "react";
import type { ProductFormState } from "@/modules/products/server/actions";

type ProductFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
  releases: {
    id: string;
    title: string;
  }[];
  initialReleaseId?: string;
  product?: {
    id: string;
    type: string;
    title: string;
    slug: string;
    fandom: string | null;
    author: string | null;
    betaOrTranslator: string | null;
    pairing: string | null;
    rating: string | null;
    tags: string | null;
    pagesCount: number | null;
    tomesCount: number | null;
    description: string;
    finalPrice: number | null;
    minPrintRun: number | null;
    status: string;
    isActive: boolean;
    releaseId?: string | null;
    paymentMode: string;
    images: {
      imageUrl: string;
    }[];
  };
};

const initialState: ProductFormState = {};

export function ProductForm({
  mode,
  action,
  product,
  releases,
  initialReleaseId,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const imageUrls = product?.images.map((image) => image.imageUrl).join("\n") ?? "";

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">
          {mode === "create" ? "Новый товар" : "Редактирование товара"}
        </h2>

        {product ? <input type="hidden" name="productId" value={product.id} /> : null}

        <div className="mt-5 grid gap-4">
          <select
            name="type"
            defaultValue={product?.type ?? "BOOK"}
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          >
            <option value="BOOK">Книга</option>
            <option value="MERCH">Мерч</option>
          </select>

          <select
            name="releaseId"
            defaultValue={product?.releaseId ?? initialReleaseId ?? ""}
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          >
            <option value="">Без релиза</option>
            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.title}
              </option>
            ))}
          </select>

          <input
            name="title"
            defaultValue={product?.title ?? ""}
            placeholder="Название"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <input
            name="slug"
            defaultValue={product?.slug ?? ""}
            placeholder="Slug"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <input
            name="fandom"
            defaultValue={product?.fandom ?? ""}
            placeholder="Фандом"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <input
            name="author"
            defaultValue={product?.author ?? ""}
            placeholder="Автор"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <input
            name="betaOrTranslator"
            defaultValue={product?.betaOrTranslator ?? ""}
            placeholder="Бета / переводчик"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <input
            name="pairing"
            defaultValue={product?.pairing ?? ""}
            placeholder="Пейринг"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <input
            name="rating"
            defaultValue={product?.rating ?? ""}
            placeholder="Рейтинг"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <input
            name="tags"
            defaultValue={product?.tags ?? ""}
            placeholder="Метки"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="pagesCount"
              type="number"
              defaultValue={product?.pagesCount ?? ""}
              placeholder="Количество страниц"
              className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
            />

            <input
              name="tomesCount"
              type="number"
              defaultValue={product?.tomesCount ?? ""}
              placeholder="Количество томов"
              className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
            />
          </div>

          <textarea
            name="description"
            defaultValue={product?.description ?? ""}
            placeholder="Описание"
            className="min-h-36 border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="finalPrice"
              type="number"
              defaultValue={product?.finalPrice ?? ""}
              placeholder="Финальная цена"
              className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
            />

            <input
              name="minPrintRun"
              type="number"
              defaultValue={product?.minPrintRun ?? ""}
              placeholder="Мин. тираж"
              className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
            />
          </div>

          <select
            name="paymentMode"
            defaultValue={product?.paymentMode ?? "PREORDER_SPLIT"}
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          >
            <option value="PREORDER_SPLIT">Предзаказ (предоплата + постоплата)</option>
            <option value="FULL_PAYMENT">Полная оплата</option>
          </select>

          <p className="text-sm text-[var(--muted-foreground)]">
            Для книг и мерча склад не ведётся. Этапы продаж и отображаемый статус
            управляются через релиз.
          </p>

          <textarea
            name="imageUrls"
            defaultValue={imageUrls}
            placeholder="Изображения: один URL на строку"
            className="min-h-36 border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
            />
            Товар активен
          </label>

          {state.error ? (
            <p className="text-sm text-red-500">{state.error}</p>
          ) : null}
        </div>
      </div>

      <aside className="h-fit border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">Действия</h2>

        <button
          type="submit"
          disabled={pending}
          className="mt-5 block w-full border border-transparent bg-[var(--accent)] px-5 py-3 text-center text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-60"
        >
          {pending
            ? "Сохранение..."
            : mode === "create"
              ? "Создать товар"
              : "Сохранить изменения"}
        </button>
      </aside>
    </form>
  );
}
