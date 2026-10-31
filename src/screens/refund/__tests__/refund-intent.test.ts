import { describe, expect, test, vi } from "vitest";

import { createRefundIntentStore } from "../refund-intent";

function memoryKv() {
  const map = new Map<string, string>();
  return {
    get: (k: string) => map.get(k),
    set: (k: string, v: string) => void map.set(k, v),
    delete: (k: string) => void map.delete(k),
    keys: () => [...map.keys()],
  };
}

describe("createRefundIntentStore", () => {
  test("the same refund body reuses the key", () => {
    const store = createRefundIntentStore(memoryKv());
    const newKey = vi.fn(() => "r1");
    store.start("pay_1", 100, "", newKey);
    expect(store.start("pay_1", 100, "", newKey).key).toBe("r1");
    expect(newKey).toHaveBeenCalledTimes(1);
  });

  test("a different amount while one is live throws", () => {
    const store = createRefundIntentStore(memoryKv());
    store.start("pay_1", 100, "", () => "r1");
    expect(() => store.start("pay_1", 200, "", () => "r2")).toThrow();
  });

  test("the refund id is kept once the server answers", () => {
    const kv = memoryKv();
    createRefundIntentStore(kv).start("pay_1", 100, "wrong dish", () => "r1");
    createRefundIntentStore(kv).attachRefund("pay_1", "ref_9");
    expect(createRefundIntentStore(kv).get("pay_1")).toMatchObject({
      key: "r1",
      refundId: "ref_9",
    });
  });

  test("clear lets the next refund mint a new key", () => {
    const store = createRefundIntentStore(memoryKv());
    store.start("pay_1", 100, "", () => "r1");
    store.clear("pay_1");
    expect(store.start("pay_1", 200, "", () => "r2").key).toBe("r2");
  });
});
