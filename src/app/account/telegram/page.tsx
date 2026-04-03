import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createTelegramLinkCodeAction } from "@/modules/telegram/server/actions";

export default async function AccountTelegramPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [connection, activeCode] = await Promise.all([
    prisma.telegramConnection.findUnique({
      where: {
        userId: user.id,
      },
    }),
    prisma.telegramLinkCode.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Telegram</h1>
        <p className="text-[var(--muted-foreground)]">
          Подключи Telegram, чтобы получать уведомления о заказах.
        </p>
      </div>

      <section className="mt-8 border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">Текущий статус</h2>

        {connection ? (
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div>
              <span className="text-[var(--muted-foreground)]">Telegram chat ID:</span>{" "}
              {connection.telegramChatId || "—"}
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Username:</span>{" "}
              {connection.telegramUsername || "—"}
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Подключён:</span>{" "}
              {new Date(connection.createdAt).toLocaleString("ru-RU")}
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Подтверждён:</span>{" "}
              {connection.isVerified ? "Да" : "Нет"}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Telegram пока не подключён.
          </p>
        )}
      </section>

      <section className="mt-6 border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">Привязка</h2>

        <div className="mt-4 flex flex-col gap-4 text-sm">
          <p className="text-[var(--muted-foreground)]">
            1. Нажми кнопку ниже.
            <br />
            2. Получи одноразовый код.
            <br />
            3. Отправь его боту командой:
            <br />
            <code>/link КОД</code>
          </p>

          {activeCode ? (
            <div className="border border-[var(--border)] bg-[var(--muted)] p-4">
              <div className="text-xs text-[var(--muted-foreground)]">Твой код</div>
              <div className="mt-2 text-2xl font-semibold tracking-widest">
                {activeCode.code}
              </div>
              <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                Действует до {new Date(activeCode.expiresAt).toLocaleTimeString("ru-RU")}
              </div>
            </div>
          ) : null}

          <form action={createTelegramLinkCodeAction}>
            <button
              type="submit"
              className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
            >
              {activeCode ? "Сгенерировать новый код" : "Получить код привязки"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}