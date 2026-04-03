import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVkLinkCodeAction } from "@/modules/vk/server/actions";

export default async function AccountVkPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [connection, activeCode] = await Promise.all([
    prisma.vkConnection.findUnique({
      where: {
        userId: user.id,
      },
    }),
    prisma.vkLinkCode.findFirst({
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
        <h1 className="text-3xl font-semibold">VK</h1>
        <p className="text-[var(--muted-foreground)]">
          Подключите сообщения VK, чтобы получать уведомления и рассылки в сообществе.
        </p>
      </div>

      <section className="mt-8 border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">Текущий статус</h2>

        {connection ? (
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div>
              <span className="text-[var(--muted-foreground)]">VK user ID:</span>{" "}
              {connection.vkUserId || "—"}
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Username:</span>{" "}
              {connection.vkUsername || "—"}
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
            VK пока не подключён.
          </p>
        )}
      </section>

      <section className="mt-6 border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">Привязка</h2>

        <div className="mt-4 flex flex-col gap-4 text-sm">
          <p className="text-[var(--muted-foreground)]">
            1. Нажмите кнопку ниже.
            <br />
            2. Получите одноразовый код.
            <br />
            3. Напишите в сообщения сообщества:
            <br />
            <code>link КОД</code>
          </p>

          {activeCode ? (
            <div className="border border-[var(--border)] bg-[var(--muted)] p-4">
              <div className="text-xs text-[var(--muted-foreground)]">Ваш код</div>
              <div className="mt-2 text-2xl font-semibold tracking-widest">
                {activeCode.code}
              </div>
              <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                Действует до {new Date(activeCode.expiresAt).toLocaleTimeString("ru-RU")}
              </div>
            </div>
          ) : null}

          <form action={createVkLinkCodeAction}>
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
