import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, BackHandler } from "react-native";

import { ApiError } from "@/api/errors";
import type { Order } from "@/api/orders/interface";
import type { PaymentDetail } from "@/api/payments/interface";
import { secondsLeft } from "@/core";
import { useT } from "@/hooks/use-t";
import { clock } from "@/api/api-instance";
import { getOrder } from "@/api/orders";
import { getPayment } from "@/api/payments";
import { orderIntents } from "@/lib/intents";

import {
  changedOrder,
  declinedNow,
  isFinal,
  isOffline,
  orderGone,
  reduceOrder,
  type TillView,
  tillView,
} from "./order-status";

const POLL_MS = 1500;
const TICK_MS = 1000;
const PAYMENT_RETRY_MAX_MS = 10_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useOrderStatus(orderId: string) {
  const router = useRouter();
  const { t } = useT();

  // The last state saved for this order renders at once; the first poll replaces it.
  const [saved] = useState(() => {
    const open = orderIntents.current();
    return open?.orderId === orderId ? open.order : undefined;
  });
  const heldRef = useRef<Order | undefined>(saved);

  const [order, setOrder] = useState<Order | undefined>(saved);
  const [payment, setPayment] = useState<PaymentDetail>();
  const [nowMs, setNowMs] = useState(() => clock.now());
  const [failedPolls, setFailedPolls] = useState(0);
  const [gone, setGone] = useState(false);
  const [declined, setDeclined] = useState(false);

  const view: TillView | "loading" | "gone" = gone ? "gone" : order ? tillView(order) : "loading";
  const seconds = order ? secondsLeft(order, nowMs) : 0;
  const done = gone || (order ? isFinal(order) : false);

  const newOrder = useCallback(() => {
    orderIntents.clear();
    router.replace("/register");
  }, [router]);

  useEffect(() => {
    if (done) return;
    let live = true;
    async function poll() {
      while (live) {
        try {
          const held = heldRef.current;
          const next = reduceOrder(held, await getOrder(orderId));
          if (live) setFailedPolls(0);
          // An unchanged order changes nothing on screen, so it skips the render and the write.
          if (live && changedOrder(held, next)) {
            heldRef.current = next;
            orderIntents.remember(next);
            setDeclined(declinedNow(held, next));
            setOrder(next);
          }
        } catch (error) {
          if (error instanceof ApiError && orderGone(error)) {
            if (live) setGone(true);
            return;
          }
          // Anything else only delays the answer; the next poll asks again.
          // Stops counting once offline, so a long outage does not re-render every poll.
          if (live) setFailedPolls((n) => (isOffline(n) ? n : n + 1));
        }
        await sleep(POLL_MS);
      }
    }
    void poll();
    return () => {
      live = false;
    };
  }, [orderId, done]);

  // The API cannot cancel an order, so leaving an open QR would let it be paid unseen.
  // Back does nothing here; New order is the way out once the server has ended the order.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setNowMs(clock.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [done]);

  useEffect(() => {
    if (view !== "paid" || !order?.paymentId) return;
    const paymentId = order.paymentId;
    let live = true;
    async function load() {
      for (let attempt = 0; live; attempt++) {
        try {
          const p = await getPayment(paymentId);
          if (live) setPayment(p);
          return;
        } catch {
          await sleep(Math.min(1000 * 2 ** attempt, PAYMENT_RETRY_MAX_MS));
        }
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [view, order?.paymentId]);

  useEffect(() => {
    if (view === "paid" || view === "paying" || view === "expired" || view === "gone") {
      AccessibilityInfo.announceForAccessibility(t(`order.${view}`));
    }
  }, [view, t]);

  useEffect(() => {
    if (declined) AccessibilityInfo.announceForAccessibility(t("order.declined"));
  }, [declined, t]);

  return { order, payment, view, seconds, newOrder, offline: isOffline(failedPolls), declined };
}
