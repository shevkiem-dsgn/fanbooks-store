export function maskEmail(email: string | null | undefined) {
  if (!email) return "";

  const [local, domain] = email.split("@");

  if (!local || !domain) return "";

  if (local.length <= 2) {
    return `${local[0] ?? "*"}*@${domain}`;
  }

  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function maskPhone(phone: string | null | undefined) {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "");

  if (digits.length <= 4) {
    return "*".repeat(digits.length);
  }

  return `${"*".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
}

export function maskAddress(address: string | null | undefined) {
  if (!address) return "";

  if (address.length <= 8) {
    return `${address.slice(0, 2)}***`;
  }

  return `${address.slice(0, 6)}***`;
}
