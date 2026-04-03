"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { redirect } from "next/navigation";

export async function updateProfileAction(formData: FormData) {
  await assertSameOriginRequest();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const recipientName = String(formData.get("recipientName") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const cdekPvzCode = String(formData.get("profilePvzCode") || "").trim();
  const cdekPvzCity = String(formData.get("profilePvzCity") || "").trim();
  const cdekPvzAddress = String(formData.get("profilePvzAddress") || "").trim();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone,
      profile: {
        upsert: {
          create: {
            recipientName,
            country,
            city: cdekPvzCity || null,
            address: cdekPvzAddress || null,
            postalCode: null,
            cdekPvzCode: cdekPvzCode || null,
            cdekPvzAddress: cdekPvzAddress || null,
            cdekPvzCity: cdekPvzCity || null,
            preferredDeliveryMethod: cdekPvzCode ? "CDEK" : null,
          },
          update: {
            recipientName,
            country,
            city: cdekPvzCity || null,
            address: cdekPvzAddress || null,
            postalCode: null,
            cdekPvzCode: cdekPvzCode || null,
            cdekPvzAddress: cdekPvzAddress || null,
            cdekPvzCity: cdekPvzCity || null,
            preferredDeliveryMethod: cdekPvzCode ? "CDEK" : null,
          },
        },
      },
    },
  });

  redirect("/account");
}
