import { useQuery } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { getMensas } from "@/api/mensas";
import { createOrder } from "@/api/orders";
import { orderIntents } from "@/lib/intents";
import { loadState } from "@/lib/load-state";
import { kv } from "@/lib/storage";
import { useLocaleStore } from "@/stores/locale-store";
import { useSessionStore } from "@/stores/session-store";

import { addItem, type Cart, cartTotals, removeItem, toOrderLines } from "./cart";
import { chargeFailure, type ChargeFailure } from "./charge-failure";
import { createMensaCache } from "./mensa-cache";

const mensaCache = createMensaCache(kv);
const MENU_FRESH_MS = 5 * 60_000;

type ChargeState = "idle" | "creating" | ChargeFailure;

export function useRegister() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const signOut = useSessionStore((s) => s.signOut);
  const toggleLocale = useLocaleStore((s) => s.toggle);

  // The saved menu shows at once; the network copy replaces it in the background.
  const mensas = useQuery({
    queryKey: ["mensas"],
    queryFn: async () => {
      const fresh = await getMensas();
      mensaCache.save(fresh);
      return fresh;
    },
    initialData: mensaCache.read,
    initialDataUpdatedAt: 0,
    staleTime: MENU_FRESH_MS,
  });
  const [cart, setCart] = useState<Cart>({});
  const [charge, setCharge] = useState<ChargeState>("idle");

  const mensa = useMemo(
    () => mensas.data?.find((m) => m.id === user?.mensaId),
    [mensas.data, user?.mensaId],
  );
  const till = mensa?.tills.find((t) => t.id === user?.tillId);
  const menu = useMemo(() => mensa?.menu ?? [], [mensa]);
  const totals = useMemo(() => cartTotals(cart, menu), [cart, menu]);
  const isEmpty = Object.keys(cart).length === 0;

  const add = useCallback((itemId: string) => setCart((c) => addItem(c, itemId)), []);
  const remove = useCallback((itemId: string) => setCart((c) => removeItem(c, itemId)), []);

  const showOrder = useCallback((orderId: string) => router.push(`/order/${orderId}`), [router]);

  const chargeOrder = useCallback(async () => {
    if (isEmpty || charge === "creating") return;
    if (!user) return;
    setCharge("creating");
    const intent = orderIntents.start(toOrderLines(cart), user.id, Crypto.randomUUID);
    try {
      const { data } = await createOrder(intent.lines, intent.key);
      orderIntents.orderCreated(data);
      setCart({});
      setCharge("idle");
      showOrder(data.id);
    } catch (error) {
      const failure = chargeFailure(error);
      // An unknown outcome keeps the key, so pressing again returns the same order.
      if (failure === "refused") orderIntents.clear();
      setCharge(failure);
    }
  }, [cart, charge, isEmpty, showOrder, user]);

  const switchCashier = useCallback(() => {
    signOut();
    router.replace("/");
  }, [router, signOut]);

  const openPayments = useCallback(() => router.push("/payments"), [router]);
  const openDevFaults = useCallback(() => {
    if (__DEV__) router.push("/dev-faults");
  }, [router]);

  return {
    mensaName: mensa?.name ?? "",
    tillName: till?.name ?? "",
    menu,
    menuLoading: mensas.isPending,
    menuFailed: loadState(mensas).failed,
    retryMenu: mensas.refetch,
    cart,
    totals,
    isEmpty,
    charge,
    add,
    remove,
    chargeOrder,
    switchCashier,
    openPayments,
    openDevFaults,
    toggleLocale,
  };
}
