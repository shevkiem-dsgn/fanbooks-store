import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const connection = await prisma.telegramConnection.findUnique({
    where: {
      userId: user.id,
    },
  });
  const vkConnection = await prisma.vkConnection.findUnique({
    where: {
      userId: user.id,
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Личный кабинет</h1>
        <p className="text-[var(--muted-foreground)]">
          Добро пожаловать, {user.name}.
        </p>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-lg font-medium">Профиль</div>
          <div className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>Имя: {user.name}</p>
            <p>Email: {user.email}</p>
            <p>Телефон: {user.phone || "—"}</p>
          </div>
          <Link href="/account/profile"
            className="mt-4 inline-block border border-[var(--border)] px-4 py-2 text-sm transition hover:opacity-80">
            Редактировать профиль
          </Link>
        </div>

        <Link
          href="/account/orders"
          className="border border-[var(--border)] bg-[var(--card)] p-6 transition hover:opacity-80"
        >
          <div className="text-lg font-medium">Мои заказы</div>
          <div className="mt-3 text-sm text-[var(--muted-foreground)]">
            История заказов, оплаты и статусы.
          </div>
        </Link>

        <Link
          href="/account/telegram"
          className="border border-[var(--border)] bg-[var(--card)] p-6 transition hover:opacity-80"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-medium">Telegram</div>
            <span className="text-xs text-[var(--muted-foreground)]">
              {connection?.isVerified ? "Подключён" : "Не подключён"}
            </span>
          </div>

          <div className="mt-3 text-sm text-[var(--muted-foreground)]">
            Подключение Telegram для уведомлений.
          </div>
        </Link>

        <Link
          href="/account/vk"
          className="border border-[var(--border)] bg-[var(--card)] p-6 transition hover:opacity-80"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-medium">VK</div>
            <span className="text-xs text-[var(--muted-foreground)]">
              {vkConnection?.isVerified ? "Подключён" : "Не подключён"}
            </span>
          </div>

          <div className="mt-3 text-sm text-[var(--muted-foreground)]">
            Подключение сообщений VK для уведомлений.
          </div>
        </Link>
      </section>
    </main>
  );
}
