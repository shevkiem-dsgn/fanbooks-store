import { headers } from "next/headers";

function normalizeOrigin(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export async function assertSameOriginRequest() {
  const requestHeaders = await headers();
  const origin = normalizeOrigin(requestHeaders.get("origin"));
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") || "http";
  const expectedOrigin = host ? `${proto}://${host}` : null;

  if (!origin || !expectedOrigin || origin !== expectedOrigin) {
    throw new Error("Invalid request origin.");
  }
}
