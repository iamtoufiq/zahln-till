import { useCallback } from "react";

import { t as translate, type MessageKey } from "@/core";
import { useLocaleStore } from "@/stores/locale-store";

export function useT() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  return { t, locale };
}
