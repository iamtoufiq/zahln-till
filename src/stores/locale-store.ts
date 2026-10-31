import { create } from "zustand";

import type { Locale } from "@/core";
import { kv } from "@/lib/storage";

const KEY = "locale";

function initialLocale(): Locale {
  const saved = kv.get(KEY);
  if (saved === "de" || saved === "en") return saved;
  return "en";
}

type LocaleState = { locale: Locale; toggle: () => void };

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: initialLocale(),
  toggle: () => {
    const locale = get().locale === "de" ? "en" : "de";
    kv.set(KEY, locale);
    set({ locale });
  },
}));
