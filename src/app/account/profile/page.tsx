import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { updateProfileAction } from "@/modules/users/server/actions";
import { CdekOfficeSelect } from "@/modules/shipping/cdek/ui/office-select";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-2xl font-semibold">Профиль</h1>

        <form action={updateProfileAction} className="mt-6 grid gap-4">
          <input
            name="name"
            defaultValue={user.name}
            placeholder="Имя"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            placeholder="Телефон"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />
          <input
            name="recipientName"
            defaultValue={user.profile?.recipientName ?? ""}
            placeholder="ФИО получателя"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />
          <input
            name="country"
            defaultValue={user.profile?.country ?? ""}
            placeholder="Страна"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />
          <CdekOfficeSelect
            initialOffice={
              user.profile?.cdekPvzCode &&
              user.profile?.cdekPvzCity &&
              user.profile?.cdekPvzAddress
                ? {
                    code: user.profile.cdekPvzCode,
                    city: user.profile.cdekPvzCity,
                    address: user.profile.cdekPvzAddress,
                  }
                : undefined
            }
            fieldPrefix="profile"
          />

          <p className="text-sm text-[var(--muted-foreground)]">
            Выбранный ПВЗ будет подтягиваться в оформление заказа и использоваться
            для накладных.
          </p>

          <button
            type="submit"
            className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            Сохранить
          </button>
        </form>
      </div>
    </main>
  );
}
