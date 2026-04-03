import { prisma } from "@/lib/prisma";
import { getReleaseStatusLabel, getReleaseStatusValue } from "@/modules/releases/utils";

type DailyPoint = {
  date: string;
  orders: number;
  revenue: number;
};

type ReleaseWithRelations = Awaited<ReturnType<typeof loadReleases>>[number];

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${day}.${month}`;
}

function getDateDaysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function sum(numbers: number[]) {
  return numbers.reduce((acc, value) => acc + value, 0);
}

async function loadReleases() {
  return prisma.release.findMany({
    include: {
      products: {
        include: {
          orderItems: {
            include: {
              order: {
                include: {
                  payments: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

function buildReleaseStats(release: ReleaseWithRelations) {
  const statusValue = getReleaseStatusValue(release);
  const statusLabel = getReleaseStatusLabel(statusValue);
  const books = release.products.filter((product) => product.type === "BOOK");
  const merch = release.products.filter((product) => product.type === "MERCH");
  const releaseMinPrintRun = books.reduce(
    (maxValue, product) => Math.max(maxValue, product.minPrintRun ?? 0),
    0,
  );

  const releaseOrdersMap = new Map<
    string,
    {
      id: string;
      preorderPaid: boolean;
      finalPaid: boolean;
      deliveryPaid: boolean;
      trackNumber: string | null;
      deliveryPaymentAmount: number | null;
      totalPaid: number;
      booksCount: number;
    }
  >();

  for (const product of books) {
    for (const orderItem of product.orderItems) {
      const existing = releaseOrdersMap.get(orderItem.orderId);

      if (existing) {
        existing.booksCount += orderItem.quantity;
        continue;
      }

      releaseOrdersMap.set(orderItem.orderId, {
        id: orderItem.orderId,
        preorderPaid: orderItem.order.preorderPaid,
        finalPaid: orderItem.order.finalPaid,
        deliveryPaid: orderItem.order.deliveryPaid,
        trackNumber: orderItem.order.trackNumber,
        deliveryPaymentAmount: orderItem.order.deliveryPaymentAmount,
        totalPaid: sum(orderItem.order.payments.map((payment) => payment.amount)),
        booksCount: orderItem.quantity,
      });
    }
  }

  const releaseOrders = Array.from(releaseOrdersMap.values());
  const totalOrders = releaseOrders.length;
  const booksOrdered = sum(releaseOrders.map((order) => order.booksCount));
  const preorderPaid = releaseOrders.filter((order) => order.preorderPaid).length;
  const finalPaid = releaseOrders.filter((order) => order.finalPaid).length;
  const deliveryPaid = releaseOrders.filter((order) => order.deliveryPaid).length;
  const shipped = releaseOrders.filter((order) => Boolean(order.trackNumber)).length;
  const waitingFinal = releaseOrders.filter((order) => order.preorderPaid && !order.finalPaid).length;
  const waitingDelivery = releaseOrders.filter(
    (order) => order.finalPaid && !order.deliveryPaid,
  ).length;
  const waitingShipment = releaseOrders.filter(
    (order) => order.deliveryPaid && !order.trackNumber,
  ).length;
  const droppedAfterPreorder = Math.max(preorderPaid - finalPaid, 0);
  const remainingToMinPrintRun = Math.max(releaseMinPrintRun - booksOrdered, 0);
  const preorderDiff =
    release.finalPrice !== null && release.finalPrice !== undefined
      ? Math.max(release.finalPrice - release.preorderPrice, 0)
      : 0;
  const expectedFinalRevenue = waitingFinal * preorderDiff;
  const expectedDeliveryRevenue = sum(
    releaseOrders
      .filter((order) => order.finalPaid && !order.deliveryPaid)
      .map((order) => order.deliveryPaymentAmount ?? 0),
  );

  const booksRevenue = sum(
    books.flatMap((product) =>
      product.orderItems.map((item) => item.unitPrice * item.quantity),
    ),
  );
  const merchRevenue = sum(
    merch.flatMap((product) =>
      product.orderItems.map((item) => item.unitPrice * item.quantity),
    ),
  );
  const collectedRevenue = sum(releaseOrders.map((order) => order.totalPaid));

  let actionLabel = "Работает в штатном режиме";
  let actionTone: "neutral" | "warning" | "success" = "neutral";

  if (release.preorderOpen && remainingToMinPrintRun > 0) {
    actionLabel = `До минимального тиража не хватает ${remainingToMinPrintRun} книг`;
    actionTone = "warning";
  } else if (!release.preorderOpen && !release.finalPrice) {
    actionLabel = "Предзаказ закрыт: задайте финальную цену и откройте постоплату";
    actionTone = "warning";
  } else if (release.finalPaymentOpen && waitingFinal > 0) {
    actionLabel = `${waitingFinal} заказов ждут постоплату`;
    actionTone = "warning";
  } else if (release.deliveryOpen && waitingShipment > 0) {
    actionLabel = `${waitingShipment} оплаченных заказов ждут отправку`;
    actionTone = "warning";
  } else if (releaseMinPrintRun > 0 && remainingToMinPrintRun === 0) {
    actionLabel = "Минимальный тираж набран";
    actionTone = "success";
  }

  return {
    id: release.id,
    title: release.title,
    slug: release.slug,
    preorderOpen: release.preorderOpen,
    finalPaymentOpen: release.finalPaymentOpen,
    deliveryOpen: release.deliveryOpen,
    statusValue,
    statusLabel,
    minPrintRun: releaseMinPrintRun,
    booksOrdered,
    totalOrders,
    preorderPaid,
    finalPaid,
    deliveryPaid,
    shipped,
    waitingFinal,
    waitingDelivery,
    waitingShipment,
    remainingToMinPrintRun,
    droppedAfterPreorder,
    collectedRevenue,
    booksRevenue,
    merchRevenue,
    expectedFinalRevenue,
    expectedDeliveryRevenue,
    preorderConversion: totalOrders > 0 ? Math.round((preorderPaid / totalOrders) * 100) : 0,
    finalConversion: totalOrders > 0 ? Math.round((finalPaid / totalOrders) * 100) : 0,
    deliveryConversion: totalOrders > 0 ? Math.round((deliveryPaid / totalOrders) * 100) : 0,
    shippedConversion: totalOrders > 0 ? Math.round((shipped / totalOrders) * 100) : 0,
    actionLabel,
    actionTone,
  };
}

export async function getAnalyticsOverview(periodDays = 14) {
  const fromDate = getDateDaysAgo(periodDays - 1);

  const [orders, paymentsInPeriod, allPayments, releases, totalUsers, totalProducts] =
    await Promise.all([
      prisma.order.findMany({
        include: {
          items: {
            include: {
              product: {
                include: {
                  release: true,
                },
              },
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.payment.findMany({
        where: {
          status: "SUCCEEDED",
          paidAt: {
            gte: fromDate,
          },
        },
        orderBy: {
          paidAt: "asc",
        },
      }),
      prisma.payment.findMany({
        where: {
          status: "SUCCEEDED",
        },
      }),
      loadReleases(),
      prisma.user.count(),
      prisma.product.count(),
    ]);

  const releaseStats = releases.map(buildReleaseStats);
  const totalOrders = orders.length;
  const totalRevenue = sum(allPayments.map((payment) => payment.amount));
  const ordersInPeriod = orders.filter((order) => order.createdAt >= fromDate);
  const revenueInPeriod = sum(paymentsInPeriod.map((payment) => payment.amount));
  const preorderCollected = sum(
    allPayments.filter((payment) => payment.type === "PREORDER").map((payment) => payment.amount),
  );
  const finalCollected = sum(
    allPayments.filter((payment) => payment.type === "FINAL").map((payment) => payment.amount),
  );
  const deliveryCollected = sum(
    allPayments.filter((payment) => payment.type === "DELIVERY").map((payment) => payment.amount),
  );
  const shippedCount = orders.filter((order) => Boolean(order.trackNumber)).length;
  const readyToShipCount = orders.filter(
    (order) => order.deliveryPaid && !order.trackNumber,
  ).length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const booksRevenue = sum(releaseStats.map((release) => release.booksRevenue));
  const merchRevenue = sum(releaseStats.map((release) => release.merchRevenue));
  const expectedFinalRevenue = sum(releaseStats.map((release) => release.expectedFinalRevenue));
  const expectedDeliveryRevenue = sum(
    releaseStats.map((release) => release.expectedDeliveryRevenue),
  );
  const totalBooksOrdered = sum(releaseStats.map((release) => release.booksOrdered));
  const releasesNeedAttention = releaseStats.filter(
    (release) => release.actionTone === "warning",
  ).length;

  const actionItems = [
    ...releaseStats
      .filter((release) => release.preorderOpen && release.remainingToMinPrintRun > 0)
      .map((release) => ({
        id: `min-print-run-${release.id}`,
        title: `${release.title}: не хватает ${release.remainingToMinPrintRun} книг до минимального тиража`,
        description:
          "Посмотрите, нужно ли продлить сбор заявок или усилить анонс в Telegram.",
        href: `/admin/releases/${release.id}`,
        tone: "warning" as const,
      })),
    ...releaseStats
      .filter((release) => !release.preorderOpen && !release.finalPaid && !release.expectedFinalRevenue && !release.finalPaymentOpen && release.booksOrdered > 0 && release.statusValue !== "COMPLETED")
      .map((release) => ({
        id: `set-final-price-${release.id}`,
        title: `${release.title}: задайте финальную цену`,
        description:
          "Предзаказ уже завершён, но постоплата ещё не открыта. Пользователи ждут следующий этап.",
        href: `/admin/releases/${release.id}`,
        tone: "warning" as const,
      })),
    ...releaseStats
      .filter((release) => release.finalPaymentOpen && release.waitingFinal > 0)
      .map((release) => ({
        id: `waiting-final-${release.id}`,
        title: `${release.title}: ${release.waitingFinal} заказов ждут постоплату`,
        description:
          "Можно подготовить напоминание или рассылку для тех, кто уже внёс предоплату.",
        href: `/admin/analytics/releases/${release.id}`,
        tone: "neutral" as const,
      })),
    ...releaseStats
      .filter((release) => release.deliveryOpen && release.waitingShipment > 0)
      .map((release) => ({
        id: `waiting-shipment-${release.id}`,
        title: `${release.title}: ${release.waitingShipment} заказов уже готовы к отправке`,
        description:
          "Оплата доставки завершена, осталось добавить отправления и трек-номера.",
        href: "/admin/shipping",
        tone: "neutral" as const,
      })),
  ].slice(0, 6);

  const today = new Date();
  const daysKeys: string[] = [];

  for (let i = periodDays - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - i);
    daysKeys.push(formatDateKey(date));
  }

  const dailyMap = new Map<string, DailyPoint>();

  for (const key of daysKeys) {
    dailyMap.set(key, {
      date: formatDateLabel(key),
      orders: 0,
      revenue: 0,
    });
  }

  for (const order of ordersInPeriod) {
    const key = formatDateKey(order.createdAt);
    const point = dailyMap.get(key);
    if (point) {
      point.orders += 1;
    }
  }

  for (const payment of paymentsInPeriod) {
    if (!payment.paidAt) continue;
    const key = formatDateKey(payment.paidAt);
    const point = dailyMap.get(key);
    if (point) {
      point.revenue += payment.amount;
    }
  }

  return {
    periodDays,
    totals: {
      totalOrders,
      totalUsers,
      totalProducts,
      totalBooksOrdered,
      shippedCount,
      readyToShipCount,
      releasesNeedAttention,
    },
    money: {
      totalRevenue,
      revenueInPeriod,
      averageOrderValue,
      preorderCollected,
      finalCollected,
      deliveryCollected,
      expectedFinalRevenue,
      expectedDeliveryRevenue,
      booksRevenue,
      merchRevenue,
    },
    actionItems,
    releaseStats,
    dailyStats: Array.from(dailyMap.values()),
  };
}

export async function getReleaseAnalytics(releaseId: string) {
  const release = await prisma.release.findUnique({
    where: {
      id: releaseId,
    },
    include: {
      products: {
        include: {
          orderItems: {
            include: {
              order: {
                include: {
                  user: true,
                  payments: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!release) {
    return null;
  }

  const releaseStats = buildReleaseStats(release);
  const preorderAmountPerBook = release.preorderPrice;
  const finalAmountPerBook =
    release.finalPrice !== null && release.finalPrice !== undefined
      ? Math.max(release.finalPrice - release.preorderPrice, 0)
      : 0;

  const orderRowsMap = new Map<
    string,
    {
      id: string;
      userName: string;
      userEmail: string;
      preorderPaid: boolean;
      finalPaid: boolean;
      deliveryPaid: boolean;
      booksCount: number;
      totalPaid: number;
      trackNumber: string | null;
      nextStep: string;
    }
  >();

  for (const product of release.products.filter((item) => item.type === "BOOK")) {
    for (const orderItem of product.orderItems) {
      const existing = orderRowsMap.get(orderItem.orderId);
      const totalPaid = sum(orderItem.order.payments.map((payment) => payment.amount));

      if (existing) {
        existing.booksCount += orderItem.quantity;
        existing.totalPaid = totalPaid;
        continue;
      }

      orderRowsMap.set(orderItem.orderId, {
        id: orderItem.orderId,
        userName: orderItem.order.user.name,
        userEmail: orderItem.order.user.email,
        preorderPaid: orderItem.order.preorderPaid,
        finalPaid: orderItem.order.finalPaid,
        deliveryPaid: orderItem.order.deliveryPaid,
        booksCount: orderItem.quantity,
        totalPaid,
        trackNumber: orderItem.order.trackNumber,
        nextStep: "",
      });
    }
  }

  const orderRows = Array.from(orderRowsMap.values())
    .map((order) => {
      let nextStep = "В работе";

      if (!order.preorderPaid) {
        nextStep = "Ждёт предоплату";
      } else if (!order.finalPaid) {
        nextStep = release.finalPaymentOpen ? "Ждёт постоплату" : "Постоплата ещё не открыта";
      } else if (!order.deliveryPaid) {
        nextStep = release.deliveryOpen ? "Ждёт оплату доставки" : "Доставка ещё не открыта";
      } else if (!order.trackNumber) {
        nextStep = "Готов к отправке";
      } else {
        nextStep = "Отправлен";
      }

      return {
        ...order,
        nextStep,
      };
    })
    .sort((left, right) => Number(left.preorderPaid) - Number(right.preorderPaid));

  const topProducts = release.products
    .map((product) => ({
      id: product.id,
      title: product.title,
      type: product.type,
      soldUnits: sum(product.orderItems.map((item) => item.quantity)),
      revenue: sum(product.orderItems.map((item) => item.quantity * item.unitPrice)),
    }))
    .sort((left, right) => right.soldUnits - left.soldUnits);

  const focus = {
    statusLabel: releaseStats.statusLabel,
    minPrintRun: releaseStats.minPrintRun,
    booksOrdered: releaseStats.booksOrdered,
    remainingToMinPrintRun: releaseStats.remainingToMinPrintRun,
    canPrint: releaseStats.minPrintRun === 0 || releaseStats.remainingToMinPrintRun === 0,
    waitingFinal: releaseStats.waitingFinal,
    waitingDelivery: releaseStats.waitingDelivery,
    waitingShipment: releaseStats.waitingShipment,
    droppedAfterPreorder: releaseStats.droppedAfterPreorder,
  };

  return {
    release: {
      id: release.id,
      title: release.title,
      slug: release.slug,
      preorderPrice: release.preorderPrice,
      finalPrice: release.finalPrice,
      status: releaseStats.statusLabel,
      statusValue: releaseStats.statusValue,
    },
    focus,
    money: {
      collectedRevenue: releaseStats.collectedRevenue,
      booksRevenue: releaseStats.booksRevenue,
      merchRevenue: releaseStats.merchRevenue,
      expectedFinalRevenue: releaseStats.expectedFinalRevenue,
      expectedDeliveryRevenue: releaseStats.expectedDeliveryRevenue,
      preorderAmountPerBook,
      finalAmountPerBook,
    },
    funnel: {
      totalOrders: releaseStats.totalOrders,
      preorderPaid: releaseStats.preorderPaid,
      finalPaid: releaseStats.finalPaid,
      deliveryPaid: releaseStats.deliveryPaid,
      shipped: releaseStats.shipped,
      preorderConversion: releaseStats.preorderConversion,
      finalConversion: releaseStats.finalConversion,
      deliveryConversion: releaseStats.deliveryConversion,
      shippedConversion: releaseStats.shippedConversion,
    },
    products: topProducts,
    orderRows,
  };
}
