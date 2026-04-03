import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import {
  applyPaymentSuccess,
  calculatePaymentAmount,
  getOrderForPayment,
  type PaymentKind,
} from "@/modules/payments/server/service";

type ConfirmPayload = {
  orderId: string;
  paymentKind: PaymentKind;
  transactionId?: string;
};

export async function POST(request: Request) {
  await assertSameOriginRequest();

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Необходим вход" }, { status: 401 });
  }

  const payload = (await request.json()) as ConfirmPayload;

  if (!payload.orderId || !payload.paymentKind) {
    return NextResponse.json({ error: "Недостаточно данных" }, { status: 400 });
  }

  const order = await getOrderForPayment(payload.orderId, user.id);

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const amount = calculatePaymentAmount(order, payload.paymentKind);

  await applyPaymentSuccess({
    order,
    paymentKind: payload.paymentKind,
    amount,
    provider: "CLOUDPAYMENTS_TEST_WIDGET",
    transactionId: payload.transactionId || `cp_test_${Date.now()}`,
  });

  return NextResponse.json({
    ok: true,
    successUrl: `/payment/success?orderId=${order.id}&type=${payload.paymentKind}`,
  });
}
