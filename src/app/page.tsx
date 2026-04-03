import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl flex-col justify-center gap-8 px-6 py-20">
        <div className="flex flex-col gap-4">
          <span className="w-fit border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm text-[var(--muted-foreground)]">
            Издательство коллекционных фанатских изданий
          </span>

          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Печатные фанфики и мерч — в минималистичном интерфейсе с темной эстетикой.
          </h1>

          <p className="max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
            Здесь будет каталог товаров, личный кабинет, предоплата, постоплата,
            доставка, Telegram-уведомления и админка издательства.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/catalog"
            className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            Перейти в каталог
          </Link>

          <Link
            href="/about"
            className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium transition hover:opacity-80"
          >
            О проекте
          </Link>
        </div>
      </section>
    </main>
  );
}