import type { Locale } from "./i18n";

const formatters = new Map<Locale, Intl.NumberFormat>();

export function formatCents(cents: number, locale: Locale): string {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-IE", {
      style: "currency",
      currency: "EUR",
    });
    formatters.set(locale, formatter);
  }
  return formatter.format(cents / 100);
}

const EURO_INPUT = /^(\d{1,6})(?:[.,](\d{1,2}))?$/;

export function parseEuroInput(text: string): number | null {
  const match = EURO_INPUT.exec(text.trim());
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
  return cents > 0 ? cents : null;
}
