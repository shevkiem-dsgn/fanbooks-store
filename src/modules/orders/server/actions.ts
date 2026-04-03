"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOriginRequest } from "@/lib/request-security";
import { estimateDeliveryPrice } from "@/modules/shipping/cdek/server/service";

const checkoutSchema = z.object({
  recipientName: z.string().min(2, "Укажи имя получателя"),
  recipientPhone: z.string().min(3, "Укажи телефон"),
  recipientEmail: z.email("Некорректный email"),
  country: z.string().min(2, "Укажи страну"),
  cdekPvzCode: z.string().min(2, "Выбери ПВЗ СДЭК"),
  cdekPvzCity: z.string().min(2, "Выбери ПВЗ СДЭК"),
  cdekPvzAddress: z.string().min(3, "Выбери ПВЗ СДЭК"),
  comment: z.string().optional(),
  cartItems: z.string().min(2, "Корзина пуста"),
});

type RawCartItem = {
  productId: string;
  quantity: number;
  releaseId?: string | null;
};

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  releaseId: z.string().nullable().optional(),
});

const cartItemsSchema = z.array(cartItemSchema).min(1).max(100);

export type CheckoutActionState = {
  error?: string;
};

export async function saveOrderDeliveryPointAction(formData: FormData) {
  await assertSameOriginRequest();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const orderId = String(formData.get("orderId") || "");
  const cdekPvzCode = String(formData.get("cdekPvzCode") || "").trim();
  const cdekPvzCity = String(formData.get("cdekPvzCity") || "").trim();
  const cdekPvzAddress = String(formData.get("cdekPvzAddress") || "").trim();

  if (!orderId || !cdekPvzCode || !cdekPvzCity || !cdekPvzAddress) {
    redirect(`/account/orders/${orderId}`);
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: user.id,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    redirect("/account/orders");
  }

  const booksCount = order.items
    .filter((item) => item.itemType === "BOOK")
    .reduce((sum, item) => sum + item.quantity, 0);
  const hasMerch = order.items.some((item) => item.itemType === "MERCH");
  const deliveryPaymentAmount = estimateDeliveryPrice({
    city: cdekPvzCity,
    booksCount,
    hasMerch,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      city: cdekPvzCity,
      address: cdekPvzAddress,
      cdekPvzCode,
      deliveryMethod: "CDEK",
      deliveryPaymentAmount,
    },
  });

  redirect(`/account/orders/${order.id}`);
}

export async function createOrderAction(
  _prevState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  await assertSameOriginRequest();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const rawData = {
    recipientName: String(formData.get("recipientName") || "").trim(),
    recipientPhone: String(formData.get("recipientPhone") || "").trim(),
    recipientEmail: String(formData.get("recipientEmail") || "").trim(),
    country: String(formData.get("country") || "").trim(),
    cdekPvzCode: String(formData.get("cdekPvzCode") || "").trim(),
    cdekPvzCity: String(formData.get("cdekPvzCity") || "").trim(),
    cdekPvzAddress: String(formData.get("cdekPvzAddress") || "").trim(),
    comment: String(formData.get("comment") || "").trim(),
    cartItems: String(formData.get("cartItems") || ""),
  };

  const parsed = checkoutSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверь данные формы.",
    };
  }

  let cartItems: RawCartItem[] = [];

  try {
    cartItems = JSON.parse(parsed.data.cartItems);
  } catch {
    return {
      error: "Не удалось прочитать корзину.",
    };
  }

  const parsedCartItems = cartItemsSchema.safeParse(cartItems);

  if (!parsedCartItems.success) {
    return {
      error: "Корзина содержит некорректные данные.",
    };
  }

  cartItems = parsedCartItems.data;

  const productIds = cartItems.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    include: {
      release: true,
    },
  });

  if (products.length === 0) {
    return {
      error: "Товары не найдены.",
    };
  }

  const orderItemsData: {
    productId: string;
    quantity: number;
    unitPrice: number;
    itemType: "BOOK" | "MERCH";
  }[] = [];

  for (const cartItem of cartItems) {
    const product = products.find((productItem) => productItem.id === cartItem.productId);

    if (!product) continue;

    if (product.type === "BOOK" && product.release && !product.release.preorderOpen) {
      return {
        error: `Предзаказ по книге "${product.title}" сейчас закрыт.`,
      };
    }

    let price = 0;

    if (product.paymentMode === "FULL_PAYMENT") {
      price = product.finalPrice ?? 0;
    } else if (product.type === "BOOK") {
      price = product.release?.preorderPrice ?? 0;
    } else {
      price = product.finalPrice ?? 0;
    }

    orderItemsData.push({
      productId: product.id,
      quantity: product.type === "BOOK" ? 1 : cartItem.quantity,
      unitPrice: price,
      itemType: product.type,
    });
  }

  if (orderItemsData.length === 0) {
    return {
      error: "Не удалось сформировать состав заказа.",
    };
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      status: "ACTIVE",
      comment: parsed.data.comment || null,
      recipientName: parsed.data.recipientName,
      recipientPhone: parsed.data.recipientPhone,
      recipientEmail: parsed.data.recipientEmail,
      country: parsed.data.country,
      city: parsed.data.cdekPvzCity,
      address: parsed.data.cdekPvzAddress,
      postalCode: null,
      deliveryMethod: "CDEK",
      cdekPvzCode: parsed.data.cdekPvzCode,
      preorderPaid: false,
      finalPaid: false,
      deliveryPaid: false,
      items: {
        create: orderItemsData,
      },
    },
  });

  redirect(`/checkout/success?orderId=${order.id}`);
}
