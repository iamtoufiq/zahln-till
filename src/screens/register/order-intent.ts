import type { Order, OrderLineInput } from "@/api/orders/interface";
import { newer } from "@/core/version";
import type { KeyValue } from "@/lib/storage";

// `order` is the last state the till saw, so a relaunch can show it before the first poll answers.
type OrderIntent = {
  key: string;
  lines: OrderLineInput[];
  cashier: string;
  orderId?: string;
  order?: Order;
};

const KEY = "order-intent";

export type OrderIntentStore = ReturnType<typeof createOrderIntentStore>;

// Holds the Idempotency-Key for one ring-up, so a lost response never creates a second order.
export function createOrderIntentStore(kv: Pick<KeyValue, "get" | "set" | "delete">) {
  const current = (): OrderIntent | undefined => {
    const raw = kv.get(KEY);
    return raw ? (JSON.parse(raw) as OrderIntent) : undefined;
  };
  const write = (intent: OrderIntent) => kv.set(KEY, JSON.stringify(intent));

  return {
    current,
    start(lines: OrderLineInput[], cashier: string, newKey: () => string): OrderIntent {
      const existing = current();
      // Reuse only an attempt whose order is still unknown; a created order is never handed out twice.
      const sameAttempt =
        existing &&
        !existing.orderId &&
        existing.cashier === cashier &&
        JSON.stringify(existing.lines) === JSON.stringify(lines);
      if (sameAttempt) return existing;
      const intent = { key: newKey(), lines, cashier };
      write(intent);
      return intent;
    },
    openOrderFor(cashier: string): string | undefined {
      const existing = current();
      return existing?.cashier === cashier ? existing.orderId : undefined;
    },
    orderCreated(order: Order) {
      const existing = current();
      if (existing) write({ ...existing, orderId: order.id, order });
    },
    remember(order: Order) {
      const existing = current();
      if (existing?.orderId !== order.id) return;
      write({ ...existing, order: newer(existing.order, order) });
    },
    clear() {
      kv.delete(KEY);
    },
  };
}
