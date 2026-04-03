"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WidgetResult = {
  transactionId?: number | string;
};

type CloudPaymentsWidget = {
  pay: (
    action: "charge",
    options: Record<string, unknown>,
  ) => Promise<WidgetResult>;
};

declare global {
  interface Window {
    cp?: {
      CloudPayments: new (options: Record<string, unknown>) => CloudPaymentsWidget;
    };
  }
}

type Props = {
  orderId: string;
  paymentKind: "initial" | "final" | "delivery";
  label: string;
  amount: number;
  description?: string;
  disabled?: boolean;
};

let widgetLoader: Promise<void> | null = null;

function loadWidgetScript() {
  if (window.cp?.CloudPayments) {
    return Promise.resolve();
  }

  if (widgetLoader) {
    return widgetLoader;
  }

  widgetLoader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://widget.cloudpayments.ru/bundles/cloudpayments.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить виджет оплаты."));
    document.head.appendChild(script);
  });

  return widgetLoader;
}

export function PaymentButton({
  orderId,
  paymentKind,
  label,
  amount,
  description = "Тестовая оплата заказа",
  disabled = false,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (pending || disabled) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      await loadWidgetScript();

      if (!window.cp?.CloudPayments) {
        throw new Error("Виджет оплаты недоступен.");
      }

      const widget = new window.cp.CloudPayments({
        language: "ru-RU",
        applePaySupport: true,
        googlePaySupport: true,
        yandexPaySupport: true,
        tinkoffPaySupport: true,
        tinkoffInstallmentSupport: true,
        sbpSupport: true,
      });

      const widgetResult = await widget.pay("charge", {
        publicId: "test_api_00000000000000000000002",
        description,
        amount,
        currency: "RUB",
        invoiceId: `${orderId}:${paymentKind}`,
        accountId: orderId,
        skin: "classic",
        requireEmail: false,
      });

      const response = await fetch("/api/payments/cloudpayments/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          paymentKind,
          transactionId: widgetResult.transactionId,
        }),
      });

      const data = (await response.json()) as { successUrl?: string; error?: string };

      if (!response.ok || !data.successUrl) {
        throw new Error(data.error || "Не удалось подтвердить оплату.");
      }

      router.push(data.successUrl);
      router.refresh();
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Оплата не была завершена.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={handleClick}
        className="w-full border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Открываю виджет..." : `${label} — ${amount} ₽`}
      </button>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
