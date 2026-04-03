"use server";

import type { PaymentMode, ProductStatus, ProductType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { writeAdminAuditEvent } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { assertSameOriginRequest } from "@/lib/request-security";
import { redirect } from "next/navigation";
import { z } from "zod";

export type ProductFormState = {
  error?: string;
};

function parseNullableInt(value: FormDataEntryValue | null) {
  const stringValue = String(value || "").trim();
  if (!stringValue) return null;

  const parsed = Number(stringValue);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseImageUrls(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Некорректный slug.");
const productTypeSchema = z.enum(["BOOK", "MERCH"]);
const paymentModeSchema = z.enum(["PREORDER_SPLIT", "FULL_PAYMENT"]);

function parseImageUrlsSafe(raw: string) {
  const imageUrls = parseImageUrls(raw);

  for (const imageUrl of imageUrls) {
    try {
      const parsed = new URL(imageUrl);

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("invalid_protocol");
      }
    } catch {
      throw new Error("Укажи корректные URL изображений.");
    }
  }

  return imageUrls;
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const paymentMode = String(formData.get("paymentMode") || "PREORDER_SPLIT");
  const releaseId = String(formData.get("releaseId") || "").trim();
  const type = String(formData.get("type") || "BOOK");
  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const fandom = String(formData.get("fandom") || "").trim();
  const author = String(formData.get("author") || "").trim();
  const betaOrTranslator = String(formData.get("betaOrTranslator") || "").trim();
  const pairing = String(formData.get("pairing") || "").trim();
  const rating = String(formData.get("rating") || "").trim();
  const tags = String(formData.get("tags") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrlsRaw = String(formData.get("imageUrls") || "");
  const isActive = formData.get("isActive") === "on";

  if (!title || !slug || !description) {
    return {
      error: "Заполни обязательные поля: название, slug и описание.",
    };
  }

  const parsedType = productTypeSchema.safeParse(type);
  const parsedPaymentMode = paymentModeSchema.safeParse(paymentMode);
  const parsedSlug = slugSchema.safeParse(slug);

  if (!parsedType.success || !parsedPaymentMode.success || !parsedSlug.success) {
    return {
      error: "Проверь slug, тип товара и режим оплаты.",
    };
  }

  let imageUrls: string[];

  try {
    imageUrls = parseImageUrlsSafe(imageUrlsRaw);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Некорректные изображения.",
    };
  }

  const product = await prisma.product.create({
    data: {
      type: parsedType.data as ProductType,
      title,
      slug,
      fandom: fandom || null,
      author: author || null,
      releaseId: releaseId || null,
      betaOrTranslator: betaOrTranslator || null,
      pairing: pairing || null,
      rating: rating || null,
      paymentMode: parsedPaymentMode.data as PaymentMode,
      status: "ANNOUNCEMENT" as ProductStatus,
      stock: null,
      tags: tags || null,
      pagesCount: parseNullableInt(formData.get("pagesCount")),
      tomesCount: parseNullableInt(formData.get("tomesCount")),
      description,
      finalPrice: parseNullableInt(formData.get("finalPrice")),
      minPrintRun: parseNullableInt(formData.get("minPrintRun")),
      isActive,
      images: {
        create: imageUrls.map((url, index) => ({
          imageUrl: url,
          sortOrder: index,
          altText: title,
          isCover: index === 0,
        })),
      },
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "create_product",
    targetType: "product",
    targetId: product.id,
  });

  redirect(`/admin/products/${product.id}`);
}

export async function updateProductAction(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const paymentMode = String(formData.get("paymentMode") || "PREORDER_SPLIT");
  const releaseId = String(formData.get("releaseId") || "").trim();
  const productId = String(formData.get("productId") || "");
  const type = String(formData.get("type") || "BOOK");
  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const fandom = String(formData.get("fandom") || "").trim();
  const author = String(formData.get("author") || "").trim();
  const betaOrTranslator = String(formData.get("betaOrTranslator") || "").trim();
  const pairing = String(formData.get("pairing") || "").trim();
  const rating = String(formData.get("rating") || "").trim();
  const tags = String(formData.get("tags") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrlsRaw = String(formData.get("imageUrls") || "");
  const isActive = formData.get("isActive") === "on";

  if (!productId || !title || !slug || !description) {
    return {
      error: "Заполни обязательные поля.",
    };
  }

  const parsedType = productTypeSchema.safeParse(type);
  const parsedPaymentMode = paymentModeSchema.safeParse(paymentMode);
  const parsedSlug = slugSchema.safeParse(slug);

  if (!parsedType.success || !parsedPaymentMode.success || !parsedSlug.success) {
    return {
      error: "Проверь slug, тип товара и режим оплаты.",
    };
  }

  let imageUrls: string[];

  try {
    imageUrls = parseImageUrlsSafe(imageUrlsRaw);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Некорректные изображения.",
    };
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      releaseId: releaseId || null,
      type: parsedType.data as ProductType,
      title,
      slug,
      fandom: fandom || null,
      author: author || null,
      betaOrTranslator: betaOrTranslator || null,
      pairing: pairing || null,
      rating: rating || null,
      paymentMode: parsedPaymentMode.data as PaymentMode,
      status: "ANNOUNCEMENT" as ProductStatus,
      stock: null,
      tags: tags || null,
      pagesCount: parseNullableInt(formData.get("pagesCount")),
      tomesCount: parseNullableInt(formData.get("tomesCount")),
      description,
      finalPrice: parseNullableInt(formData.get("finalPrice")),
      minPrintRun: parseNullableInt(formData.get("minPrintRun")),
      isActive,
    },
  });

  await prisma.productImage.deleteMany({
    where: { productId },
  });

  if (imageUrls.length > 0) {
    await prisma.productImage.createMany({
      data: imageUrls.map((url, index) => ({
        productId,
        imageUrl: url,
        sortOrder: index,
        altText: title,
        isCover: index === 0,
      })),
    });
  }

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "update_product",
    targetType: "product",
    targetId: productId,
  });

  redirect(`/admin/products/${productId}`);
}

export async function deactivateProductAction(formData: FormData) {
  await assertSameOriginRequest();
  const admin = await requireAdmin();

  const productId = String(formData.get("productId") || "");

  if (!productId) return;

  await prisma.product.update({
    where: { id: productId },
    data: {
      isActive: false,
    },
  });

  await writeAdminAuditEvent({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "deactivate_product",
    targetType: "product",
    targetId: productId,
  });

  redirect("/admin/products");
}
