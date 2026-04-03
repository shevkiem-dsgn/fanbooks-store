import { createReleaseAction } from "@/modules/releases/server/actions";

export default function AdminNewReleasePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Создать релиз</h1>

      <form action={createReleaseAction} className="mt-8 flex flex-col gap-4">

        <input
          name="title"
          placeholder="Название релиза"
          className="border border-[var(--border)] bg-transparent px-4 py-3"
        />

        <input
          name="slug"
          placeholder="slug (уникальный)"
          className="border border-[var(--border)] bg-transparent px-4 py-3"
        />

        <input
          name="preorderPrice"
          type="number"
          placeholder="Предоплата"
          className="border border-[var(--border)] bg-transparent px-4 py-3"
        />

        <button
          type="submit"
          className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)]"
        >
          Создать релиз
        </button>

      </form>
    </main>
  );
}