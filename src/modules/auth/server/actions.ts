"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

const signUpSchema = z.object({
  name: z.string().min(2, "Имя слишком короткое"),
  email: z.email("Некорректный email"),
  phone: z.string().optional(),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
});

const signInSchema = z.object({
  email: z.email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export type AuthActionState = {
  error?: string;
};

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await assertSameOriginRequest();

  const rawData = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    phone: String(formData.get("phone") || "").trim(),
    password: String(formData.get("password") || ""),
  };

  const parsed = signUpSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверь данные формы.",
    };
  }

  const signUpRateLimit = consumeRateLimit({
    key: `sign-up:${parsed.data.email}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!signUpRateLimit.allowed) {
    return {
      error: "Слишком много попыток регистрации. Попробуйте чуть позже.",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return {
      error: "Пользователь с таким email уже существует.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash,
      profile: {
        create: {},
      },
    },
  });

  await createSession(user.id);
  redirect("/account");
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await assertSameOriginRequest();

  const rawData = {
    email: String(formData.get("email") || "").trim().toLowerCase(),
    password: String(formData.get("password") || ""),
  };

  const parsed = signInSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверь данные формы.",
    };
  }

  const signInRateLimit = consumeRateLimit({
    key: `sign-in:${parsed.data.email}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!signInRateLimit.allowed) {
    return {
      error: "Слишком много попыток входа. Попробуйте чуть позже.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return {
      error: "Неверный email или пароль.",
    };
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!isValid) {
    return {
      error: "Неверный email или пароль.",
    };
  }

  await createSession(user.id);
  redirect("/account");
}

export async function signOutAction() {
  await assertSameOriginRequest();

  await deleteSession();
  redirect("/");
}
