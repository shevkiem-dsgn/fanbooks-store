"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signInAction,
  type AuthActionState,
} from "@/modules/auth/server/actions";

const initialState: AuthActionState = {};

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-2xl font-semibold">Вход</h1>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Пароль"
            className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
          />

          {state.error ? (
            <p className="text-sm text-red-400">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Вход..." : "Войти"}
          </button>
        </form>

        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          Нет аккаунта?{" "}
          <Link href="/sign-up" className="text-[var(--foreground)] underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </main>
  );
}