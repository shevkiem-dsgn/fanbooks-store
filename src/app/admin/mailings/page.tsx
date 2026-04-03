import { prisma } from "@/lib/prisma";
import { getTelegramMailings } from "@/modules/telegram/server/service";
import { MailingForm } from "@/modules/telegram/ui/mailing-form";

type Props = {
  searchParams?: Promise<{
    target?: string;
    releaseId?: string;
    productId?: string;
    template?: string;
  }>;
};

export default async function AdminMailingsPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [releases, products, history] = await Promise.all([
    prisma.release.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
      },
    }),
    getTelegramMailings(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Telegram-рассылки</h1>
        <p className="text-[var(--muted-foreground)]">
          Отправка уведомлений всем, по релизу или по товару.
        </p>
      </div>

      <div className="mt-10">
        <MailingForm
          releases={releases}
          products={products}
          history={history.map((item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
            sentAt: item.sentAt ? item.sentAt.toISOString() : null,
          }))}
          initialTarget={resolvedSearchParams?.target}
          initialReleaseId={resolvedSearchParams?.releaseId}
          initialProductId={resolvedSearchParams?.productId}
          initialTemplate={resolvedSearchParams?.template}
        />
      </div>
    </main>
  );
}
