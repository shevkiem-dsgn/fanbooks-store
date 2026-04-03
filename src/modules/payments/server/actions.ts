"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  applyPaymentSuccess,
  calculatePaymentAmount,
  getOrderForPayment,
  type PaymentKind,
} from "@/modules/payments/server/service";

export async function simulatePaymentAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const orderId = String(formData.get("orderId") || "");
  const paymentKind = String(formData.get("paymentKind") || "") as PaymentKind;

  if (!orderId || !paymentKind) {
    redirect("/account/orders");
  }

  const order = await getOrderForPayment(orderId, user.id);

  if (!order) {
    redirect("/account/orders");
  }

  const amount = calculatePaymentAmount(order, paymentKind);

  await applyPaymentSuccess({
    order,
    paymentKind,
    amount,
    provider: "LOCAL_SIMULATION",
    transactionId: `local_${Date.now()}`,
  });

  redirect(`/payment/success?orderId=${order.id}&type=${paymentKind}`);
}
