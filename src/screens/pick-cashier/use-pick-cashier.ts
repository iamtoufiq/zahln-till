import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { useSessionStore } from "@/stores/session-store";

export const CASHIERS = [
  { username: "cashier-campus-1", label: "Mensa am Campus · Kasse 1" },
  { username: "cashier-campus-2", label: "Mensa am Campus · Kasse 2" },
  { username: "cashier-campus-3", label: "Mensa am Campus · Kasse 3" },
  { username: "cashier-nord-1", label: "Mensa Nord · Kasse 1" },
  { username: "cashier-nord-2", label: "Mensa Nord · Kasse 2" },
  { username: "cashier-bibliothek-1", label: "Cafeteria Bibliothek · Kasse 1" },
];

export function usePickCashier() {
  const router = useRouter();
  const signIn = useSessionStore((s) => s.signIn);

  const [pending, setPending] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const pick = useCallback(
    async (username: string) => {
      setPending(username);
      setFailed(false);
      try {
        await signIn(username);
        router.replace("/register");
      } catch {
        setFailed(true);
      } finally {
        setPending(null);
      }
    },
    [router, signIn],
  );

  return { pending, failed, pick };
}
