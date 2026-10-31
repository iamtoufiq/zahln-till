import type { Locale } from "./i18n";

const formatters = new Map<Locale, Intl.DateTimeFormat>();

export function formatDateTime(iso: string, locale: Locale): string {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
      timeZone: "Europe/Berlin",
      day: "numeric",
      month: locale === "de" ? "2-digit" : "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    formatters.set(locale, formatter);
  }
  return formatter.format(new Date(iso));
}
