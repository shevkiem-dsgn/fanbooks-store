import "dotenv/config";
import path from "node:path";
import Database from "better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

function resolveSqlitePath(url: string) {
  if (!url.startsWith("file:")) {
    throw new Error("OLD_SQLITE_DATABASE_URL must use file: syntax.");
  }

  const filePath = url.slice("file:".length);
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

function toDate(value: unknown) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(String(value));
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return false;
}

async function main() {
  const postgresUrl = process.env.DATABASE_URL?.trim();
  const oldSqliteUrl = process.env.OLD_SQLITE_DATABASE_URL?.trim() || "file:./dev.db";

  if (!postgresUrl) {
    throw new Error("DATABASE_URL must point to PostgreSQL before migration.");
  }

  const sqlite = new Database(resolveSqlitePath(oldSqliteUrl), { readonly: true });
  const adapter = new PrismaPg({ connectionString: postgresUrl });
  const prisma = new PrismaClient({ adapter });

  const users = sqlite.prepare('SELECT * FROM "User"').all() as Record<string, unknown>[];
  const userProfiles = sqlite.prepare('SELECT * FROM "UserProfile"').all() as Record<string, unknown>[];
  const telegramConnections = sqlite.prepare('SELECT * FROM "TelegramConnection"').all() as Record<string, unknown>[];
  const vkConnections = sqlite.prepare('SELECT * FROM "VkConnection"').all() as Record<string, unknown>[];
  const telegramLinkCodes = sqlite.prepare('SELECT * FROM "TelegramLinkCode"').all() as Record<string, unknown>[];
  const vkLinkCodes = sqlite.prepare('SELECT * FROM "VkLinkCode"').all() as Record<string, unknown>[];
  const releases = sqlite.prepare('SELECT * FROM "Release"').all() as Record<string, unknown>[];
  const products = sqlite.prepare('SELECT * FROM "Product"').all() as Record<string, unknown>[];
  const productImages = sqlite.prepare('SELECT * FROM "ProductImage"').all() as Record<string, unknown>[];
  const orders = sqlite.prepare('SELECT * FROM "Order"').all() as Record<string, unknown>[];
  const orderItems = sqlite.prepare('SELECT * FROM "OrderItem"').all() as Record<string, unknown>[];
  const payments = sqlite.prepare('SELECT * FROM "Payment"').all() as Record<string, unknown>[];
  const deliveries = sqlite.prepare('SELECT * FROM "Delivery"').all() as Record<string, unknown>[];
  const refundRequests = sqlite.prepare('SELECT * FROM "RefundRequest"').all() as Record<string, unknown>[];
  const notifications = sqlite.prepare('SELECT * FROM "Notification"').all() as Record<string, unknown>[];
  const analyticsEvents = sqlite.prepare('SELECT * FROM "AnalyticsEvent"').all() as Record<string, unknown>[];
  const sessions = sqlite.prepare('SELECT * FROM "Session"').all() as Record<string, unknown>[];
  const telegramMailings = sqlite.prepare('SELECT * FROM "TelegramMailing"').all() as Record<string, unknown>[];

  await prisma.notification.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.telegramMailing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.release.deleteMany();
  await prisma.session.deleteMany();
  await prisma.telegramConnection.deleteMany();
  await prisma.vkConnection.deleteMany();
  await prisma.telegramLinkCode.deleteMany();
  await prisma.vkLinkCode.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  if (users.length > 0) {
    await prisma.user.createMany({
      data: users.map((row) => ({
        id: String(row.id),
        isAdmin: toBoolean(row.isAdmin),
        name: String(row.name),
        email: String(row.email),
        passwordHash: String(row.passwordHash),
        phone: row.phone ? String(row.phone) : null,
        telegramEnabled: toBoolean(row.telegramEnabled),
        vkEnabled: toBoolean(row.vkEnabled),
        createdAt: toDate(row.createdAt) ?? new Date(),
        updatedAt: toDate(row.updatedAt) ?? new Date(),
      })),
    });
  }

  if (userProfiles.length > 0) {
    await prisma.userProfile.createMany({
      data: userProfiles.map((row) => ({
        id: String(row.id),
        userId: String(row.userId),
        recipientName: row.recipientName ? String(row.recipientName) : null,
        country: row.country ? String(row.country) : null,
        city: row.city ? String(row.city) : null,
        address: row.address ? String(row.address) : null,
        postalCode: row.postalCode ? String(row.postalCode) : null,
        cdekPvzCode: row.cdekPvzCode ? String(row.cdekPvzCode) : null,
        cdekPvzAddress: row.cdekPvzAddress ? String(row.cdekPvzAddress) : null,
        cdekPvzCity: row.cdekPvzCity ? String(row.cdekPvzCity) : null,
        preferredDeliveryMethod: row.preferredDeliveryMethod ? String(row.preferredDeliveryMethod) as never : null,
        needsManualDeliveryContactDefault: toBoolean(row.needsManualDeliveryContactDefault),
        createdAt: toDate(row.createdAt) ?? new Date(),
        updatedAt: toDate(row.updatedAt) ?? new Date(),
      })),
    });
  }

  if (telegramConnections.length > 0) {
    await prisma.telegramConnection.createMany({
      data: telegramConnections.map((row) => ({
        id: String(row.id),
        userId: String(row.userId),
        telegramChatId: row.telegramChatId ? String(row.telegramChatId) : null,
        telegramUsername: row.telegramUsername ? String(row.telegramUsername) : null,
        isVerified: toBoolean(row.isVerified),
        createdAt: toDate(row.createdAt) ?? new Date(),
      })),
    });
  }

  if (vkConnections.length > 0) {
    await prisma.vkConnection.createMany({
      data: vkConnections.map((row) => ({
        id: String(row.id),
        userId: String(row.userId),
        vkUserId: row.vkUserId ? String(row.vkUserId) : null,
        vkUsername: row.vkUsername ? String(row.vkUsername) : null,
        isVerified: toBoolean(row.isVerified),
        createdAt: toDate(row.createdAt) ?? new Date(),
      })),
    });
  }

  if (telegramLinkCodes.length > 0) {
    await prisma.telegramLinkCode.createMany({
      data: telegramLinkCodes.map((row) => ({
        id: String(row.id),
        code: String(row.code),
        userId: String(row.userId),
        expiresAt: toDate(row.expiresAt) ?? new Date(),
        usedAt: toDate(row.usedAt),
        createdAt: toDate(row.createdAt) ?? new Date(),
      })),
    });
  }

  if (vkLinkCodes.length > 0) {
    await prisma.vkLinkCode.createMany({
      data: vkLinkCodes.map((row) => ({
        id: String(row.id),
        code: String(row.code),
        userId: String(row.userId),
        expiresAt: toDate(row.expiresAt) ?? new Date(),
        usedAt: toDate(row.usedAt),
        createdAt: toDate(row.createdAt) ?? new Date(),
      })),
    });
  }

  if (releases.length > 0) {
    await prisma.release.createMany({
      data: releases.map((row) => ({
        id: String(row.id),
        status: String(row.status) as never,
        title: String(row.title),
        slug: String(row.slug),
        preorderPrice: Number(row.preorderPrice),
        finalPrice: row.finalPrice !== null && row.finalPrice !== undefined ? Number(row.finalPrice) : null,
        preorderOpen: toBoolean(row.preorderOpen),
        finalPaymentOpen: toBoolean(row.finalPaymentOpen),
        deliveryOpen: toBoolean(row.deliveryOpen),
        createdAt: toDate(row.createdAt) ?? new Date(),
      })),
    });
  }

  if (products.length > 0) {
    await prisma.product.createMany({
      data: products.map((row) => ({
        id: String(row.id),
        type: String(row.type) as never,
        title: String(row.title),
        slug: String(row.slug),
        fandom: row.fandom ? String(row.fandom) : null,
        author: row.author ? String(row.author) : null,
        betaOrTranslator: row.betaOrTranslator ? String(row.betaOrTranslator) : null,
        pairing: row.pairing ? String(row.pairing) : null,
        rating: row.rating ? String(row.rating) : null,
        tags: row.tags ? String(row.tags) : null,
        pagesCount: row.pagesCount !== null && row.pagesCount !== undefined ? Number(row.pagesCount) : null,
        tomesCount: row.tomesCount !== null && row.tomesCount !== undefined ? Number(row.tomesCount) : null,
        description: String(row.description),
        preorderAmount: row.preorderAmount !== null && row.preorderAmount !== undefined ? Number(row.preorderAmount) : null,
        finalPrice: row.finalPrice !== null && row.finalPrice !== undefined ? Number(row.finalPrice) : null,
        stock: row.stock !== null && row.stock !== undefined ? Number(row.stock) : null,
        paymentMode: String(row.paymentMode) as never,
        minPrintRun: row.minPrintRun !== null && row.minPrintRun !== undefined ? Number(row.minPrintRun) : null,
        status: String(row.status) as never,
        isActive: toBoolean(row.isActive),
        createdAt: toDate(row.createdAt) ?? new Date(),
        updatedAt: toDate(row.updatedAt) ?? new Date(),
        releaseId: row.releaseId ? String(row.releaseId) : null,
      })),
    });
  }

  if (productImages.length > 0) {
    await prisma.productImage.createMany({
      data: productImages.map((row) => ({
        id: String(row.id),
        productId: String(row.productId),
        imageUrl: String(row.imageUrl),
        sortOrder: Number(row.sortOrder),
        altText: row.altText ? String(row.altText) : null,
        isCover: toBoolean(row.isCover),
        createdAt: toDate(row.createdAt) ?? new Date(),
      })),
    });
  }

  if (orders.length > 0) {
    await prisma.order.createMany({
      data: orders.map((row) => ({
        id: String(row.id),
        userId: String(row.userId),
        releaseId: row.releaseId ? String(row.releaseId) : null,
        status: String(row.status) as never,
        comment: row.comment ? String(row.comment) : null,
        adminNote: row.adminNote ? String(row.adminNote) : null,
        recipientName: row.recipientName ? String(row.recipientName) : null,
        recipientPhone: row.recipientPhone ? String(row.recipientPhone) : null,
        recipientEmail: row.recipientEmail ? String(row.recipientEmail) : null,
        country: row.country ? String(row.country) : null,
        city: row.city ? String(row.city) : null,
        address: row.address ? String(row.address) : null,
        postalCode: row.postalCode ? String(row.postalCode) : null,
        deliveryMethod: row.deliveryMethod ? String(row.deliveryMethod) as never : null,
        needsManualDeliveryContact: toBoolean(row.needsManualDeliveryContact),
        cdekPvzCode: row.cdekPvzCode ? String(row.cdekPvzCode) : null,
        preorderPaid: toBoolean(row.preorderPaid),
        finalPaid: toBoolean(row.finalPaid),
        deliveryPaid: toBoolean(row.deliveryPaid),
        finalPaymentAmount: row.finalPaymentAmount !== null && row.finalPaymentAmount !== undefined ? Number(row.finalPaymentAmount) : null,
        deliveryPaymentAmount: row.deliveryPaymentAmount !== null && row.deliveryPaymentAmount !== undefined ? Number(row.deliveryPaymentAmount) : null,
        trackNumber: row.trackNumber ? String(row.trackNumber) : null,
        cdekOrderId: row.cdekOrderId ? String(row.cdekOrderId) : null,
        createdAt: toDate(row.createdAt) ?? new Date(),
        updatedAt: toDate(row.updatedAt) ?? new Date(),
      })),
    });
  }

  if (orderItems.length > 0) {
    await prisma.orderItem.createMany({
      data: orderItems.map((row) => ({
        id: String(row.id),
        orderId: String(row.orderId),
        productId: String(row.productId),
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
        itemType: String(row.itemType) as never,
      })),
    });
  }

  if (payments.length > 0) {
    await prisma.payment.createMany({
      data: payments.map((row) => ({
        id: String(row.id),
        orderId: String(row.orderId),
        type: String(row.type) as never,
        amount: Number(row.amount),
        status: String(row.status) as never,
        provider: row.provider ? String(row.provider) : null,
        transactionId: row.transactionId ? String(row.transactionId) : null,
        paidAt: toDate(row.paidAt),
        createdAt: toDate(row.createdAt) ?? new Date(),
      })),
    });
  }

  if (deliveries.length > 0) {
    await prisma.delivery.createMany({
      data: deliveries.map((row) => ({
        id: String(row.id),
        orderId: String(row.orderId),
        deliveryProvider: row.deliveryProvider ? String(row.deliveryProvider) : null,
        deliveryPrice: row.deliveryPrice !== null && row.deliveryPrice !== undefined ? Number(row.deliveryPrice) : null,
        deliveryStatus: String(row.deliveryStatus) as never,
        trackNumber: row.trackNumber ? String(row.trackNumber) : null,
        cdekPvzCode: row.cdekPvzCode ? String(row.cdekPvzCode) : null,
        shipmentExternalId: row.shipmentExternalId ? String(row.shipmentExternalId) : null,
        comment: row.comment ? String(row.comment) : null,
        createdAt: toDate(row.createdAt) ?? new Date(),
        updatedAt: toDate(row.updatedAt) ?? new Date(),
      })),
    });
  }

  if (refundRequests.length > 0) {
    await prisma.refundRequest.createMany({
      data: refundRequests.map((row) => ({
        id: String(row.id),
        orderId: String(row.orderId),
        userId: String(row.userId),
        reason: row.reason ? String(row.reason) : null,
        status: String(row.status) as never,
        reviewedBy: row.reviewedBy ? String(row.reviewedBy) : null,
        createdAt: toDate(row.createdAt) ?? new Date(),
        updatedAt: toDate(row.updatedAt) ?? new Date(),
      })),
    });
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications.map((row) => ({
        id: String(row.id),
        userId: String(row.userId),
        orderId: row.orderId ? String(row.orderId) : null,
        channel: String(row.channel),
        type: String(row.type),
        payload: row.payload ? String(row.payload) : null,
        sentAt: toDate(row.sentAt),
        status: row.status ? String(row.status) : null,
        createdAt: toDate(row.createdAt) ?? new Date(),
      })),
    });
  }

  if (analyticsEvents.length > 0) {
    await prisma.analyticsEvent.createMany({
      data: analyticsEvents.map((row) => ({
        id: String(row.id),
        userId: row.userId ? String(row.userId) : null,
        productId: row.productId ? String(row.productId) : null,
        eventType: String(row.eventType),
        metadata: row.metadata ? String(row.metadata) : null,
        createdAt: toDate(row.createdAt) ?? new Date(),
      })),
    });
  }

  if (sessions.length > 0) {
    await prisma.session.createMany({
      data: sessions.map((row) => ({
        id: String(row.id),
        userId: String(row.userId),
        token: String(row.token),
        expiresAt: toDate(row.expiresAt) ?? new Date(),
        createdAt: toDate(row.createdAt) ?? new Date(),
      })),
    });
  }

  if (telegramMailings.length > 0) {
    await prisma.telegramMailing.createMany({
      data: telegramMailings.map((row) => ({
        id: String(row.id),
        channel: String(row.channel),
        target: String(row.target),
        releaseId: row.releaseId ? String(row.releaseId) : null,
        productId: row.productId ? String(row.productId) : null,
        text: String(row.text),
        imageUrl: row.imageUrl ? String(row.imageUrl) : null,
        recipients: Number(row.recipients),
        sentCount: Number(row.sentCount),
        failedCount: Number(row.failedCount),
        status: String(row.status) as never,
        errorMessage: row.errorMessage ? String(row.errorMessage) : null,
        createdAt: toDate(row.createdAt) ?? new Date(),
        sentAt: toDate(row.sentAt),
      })),
    });
  }

  console.log("SQLite -> PostgreSQL migration completed", {
    users: users.length,
    releases: releases.length,
    products: products.length,
    orders: orders.length,
    payments: payments.length,
  });

  await prisma.$disconnect();
  sqlite.close();
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
