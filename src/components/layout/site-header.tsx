import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CartIndicator } from "@/modules/cart/ui/cart-indicator";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--background)/0.85] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          КНИГОВЁРТ
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[var(--muted-foreground)] md:flex">
          <Link href="/catalog" className="transition hover:text-[var(--foreground)]">
            Каталог
          </Link>
          <Link href="/faq" className="transition hover:text-[var(--foreground)]">
            FAQ
          </Link>
          <Link href="/about" className="transition hover:text-[var(--foreground)]">
            О нас
          </Link>
          <Link href="/cart" className="transition hover:text-[var(--foreground)]">
            Корзина
          </Link>
          {user ? (
            <Link href="/account" className="transition hover:text-[var(--foreground)]">
              Личный кабинет
            </Link>
          ) : (
            <Link href="/sign-in" className="transition hover:text-[var(--foreground)]">
              Войти
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <CartIndicator />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}