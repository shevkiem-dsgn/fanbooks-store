import { prisma } from "@/lib/prisma";

export async function getReleases() {
  return prisma.release.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getRelease(id: string) {
  return prisma.release.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function openFinalPayment(releaseId: string, price: number) {
  return prisma.release.update({
    where: { id: releaseId },
    data: {
      finalPrice: price,
      preorderOpen: false,
      finalPaymentOpen: true,
      deliveryOpen: false,
    },
  });
}

export async function openDeliveryPayment(releaseId: string) {
  return prisma.release.update({
    where: { id: releaseId },
    data: {
      preorderOpen: false,
      finalPaymentOpen: false,
      deliveryOpen: true,
    },
  });
}

export async function getReleaseOrderSummaries(releaseId: string) {
  const orderItems = await prisma.orderItem.findMany({
    where: {
      itemType: "BOOK",
      product: {
        releaseId,
      },
    },
    include: {
      product: true,
      order: {
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
    orderBy: {
      order: {
        createdAt: "desc",
      },
    },
  });

  const ordersMap = new Map<
    string,
    {
      id: string;
      createdAt: Date;
      user: {
        name: string;
        email: string;
      };
      preorderPaid: boolean;
      finalPaid: boolean;
      deliveryPaid: boolean;
      trackNumber: string | null;
      cdekPvzCode: string | null;
      recipientName: string | null;
      recipientPhone: string | null;
      recipientEmail: string | null;
      country: string | null;
      city: string | null;
      address: string | null;
      postalCode: string | null;
      items: {
        productTitle: string;
        quantity: number;
      }[];
      booksCount: number;
    }
  >();

  for (const orderItem of orderItems) {
    const existing = ordersMap.get(orderItem.orderId);

    if (existing) {
      existing.items.push({
        productTitle: orderItem.product.title,
        quantity: orderItem.quantity,
      });
      existing.booksCount += orderItem.quantity;
      continue;
    }

    ordersMap.set(orderItem.orderId, {
      id: orderItem.order.id,
      createdAt: orderItem.order.createdAt,
      user: {
        name: orderItem.order.user.name,
        email: orderItem.order.user.email,
      },
      preorderPaid: orderItem.order.preorderPaid,
      finalPaid: orderItem.order.finalPaid,
      deliveryPaid: orderItem.order.deliveryPaid,
      trackNumber: orderItem.order.trackNumber,
      cdekPvzCode: orderItem.order.cdekPvzCode,
      recipientName: orderItem.order.recipientName,
      recipientPhone: orderItem.order.recipientPhone,
      recipientEmail: orderItem.order.recipientEmail,
      country: orderItem.order.country,
      city: orderItem.order.city,
      address: orderItem.order.address,
      postalCode: orderItem.order.postalCode,
      items: [
        {
          productTitle: orderItem.product.title,
          quantity: orderItem.quantity,
        },
      ],
      booksCount: orderItem.quantity,
    });
  }

  return Array.from(ordersMap.values()).sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
}
