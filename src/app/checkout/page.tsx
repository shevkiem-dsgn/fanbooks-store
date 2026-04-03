import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutForm } from "@/modules/orders/ui/checkout-form";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Оформление заказа</h1>
        <p className="text-[var(--muted-foreground)]">
          Данные формы уже подтянуты из профиля. При необходимости их можно изменить.
        </p>
      </div>

      <div className="mt-10">
        <CheckoutForm
          user={{
            name: user.name,
            email: user.email,
            phone: user.phone ?? "",
            recipientName: user.profile?.recipientName ?? user.name ?? "",
            country: user.profile?.country ?? "Россия",
            cdekPvzCode: user.profile?.cdekPvzCode ?? "",
            cdekPvzCity: user.profile?.cdekPvzCity ?? "",
            cdekPvzAddress: user.profile?.cdekPvzAddress ?? "",
          }}
          releaseId=""
        />
      </div>
    </main>
  );
}
