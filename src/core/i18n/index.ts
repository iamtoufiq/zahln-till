import type { LocalizedText } from "@/api/orders/interface";

import { de } from "./de";
import { en, type MessageKey } from "./en";

export type Locale = "de" | "en";
export type { MessageKey };

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { de, en };

export function t(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const template = MESSAGES[locale][key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function itemName(name: LocalizedText, locale: Locale): string {
  return name[locale];
}
