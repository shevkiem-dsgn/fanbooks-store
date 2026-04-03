import { prisma } from "@/lib/prisma";
import { AiAdminPanel } from "@/modules/ai/ui/ai-admin-panel";

export default async function AdminAiPage() {
  const releases = await prisma.release.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">ИИ-помощник</h1>
        <p className="max-w-3xl text-[var(--muted-foreground)]">
          Локальный ИИ помогает администратору быстро понять ситуацию по релизу,
          оценить прогноз заявок и подготовить черновик рассылки без ручной рутины.
        </p>
      </div>

      <div className="mt-10">
        <AiAdminPanel releases={releases} />
      </div>
    </main>
  );
}
