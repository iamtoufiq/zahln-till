import type { KeyValue } from "@/lib/storage";

export type RefundIntent = {
  paymentId: string;
  key: string;
  amountCents: number;
  reason: string;
  refundId?: string;
};

const PREFIX = "refund-intent:";

export type RefundIntentStore = ReturnType<typeof createRefundIntentStore>;

// One refund intent per payment; a new key only after the previous refund has an outcome.
export function createRefundIntentStore(kv: Pick<KeyValue, "get" | "set" | "delete">) {
  const get = (paymentId: string): RefundIntent | undefined => {
    const raw = kv.get(PREFIX + paymentId);
    return raw ? (JSON.parse(raw) as RefundIntent) : undefined;
  };
  const write = (intent: RefundIntent) => kv.set(PREFIX + intent.paymentId, JSON.stringify(intent));

  return {
    get,
    start(paymentId: string, amountCents: number, reason: string, newKey: () => string) {
      const existing = get(paymentId);
      if (existing) {
        if (existing.amountCents !== amountCents || existing.reason !== reason) {
          throw new Error(`A different refund for ${paymentId} is still open`);
        }
        return existing;
      }
      const intent: RefundIntent = { paymentId, key: newKey(), amountCents, reason };
      write(intent);
      return intent;
    },
    attachRefund(paymentId: string, refundId: string) {
      const existing = get(paymentId);
      if (existing) write({ ...existing, refundId });
    },
    clear(paymentId: string) {
      kv.delete(PREFIX + paymentId);
    },
  };
}
