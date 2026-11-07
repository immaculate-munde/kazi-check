/**
 * Public app origin for SMS / USSD / emails.
 * Always returns an absolute URL with a scheme so phones auto-link it.
 */
export function getAppBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .trim()
    .replace(/\/+$/, "");

  if (/^https?:\/\//i.test(raw)) return raw;

  if (raw.includes("localhost") || raw.startsWith("127.")) {
    return `http://${raw}`;
  }

  return `https://${raw}`;
}

/** Absolute path on the public app (e.g. /checks/abc → https://…/checks/abc). */
export function absoluteAppUrl(path: string): string {
  const base = getAppBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
