import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="flex flex-col gap-3">
          <div className="text-lg font-semibold tracking-tight">КНИГОВЁРТ</div>
          <p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Магазин и кабинет издательства фанатских книг: предзаказы, этапные
            оплаты, доставка через ПВЗ и сопровождение заказов в одном месте.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="font-medium">Навигация</div>
          <Link href="/catalog" className="text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
            Каталог
          </Link>
          <Link href="/faq" className="text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
            FAQ
          </Link>
          <Link href="/about" className="text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
            О проекте
          </Link>
          <Link href="/account" className="text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
            Личный кабинет
          </Link>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="font-medium">Информация</div>
          <p className="text-[var(--muted-foreground)]">
            Статусы заказов, оплаты и трек-номер обновляются в личном кабинете.
          </p>
          <p className="text-[var(--muted-foreground)]">
            Для выбора ПВЗ и оформления доставки используй страницу заказа или профиль.
          </p>
        </div>
      </div>
    </footer>
  );
}
