import { describe, expect, test, vi } from "vitest";

import type { Order } from "@/api/orders/interface";

import { createOrderIntentStore } from "../order-intent";

function memoryKv() {
  const map = new Map<string, string>();
  return {
    get: (k: string) => map.get(k),
    set: (k: string, v: string) => void map.set(k, v),
    delete: (k: string) => void map.delete(k),
    keys: () => [...map.keys()],
  };
}

const lines = [{ itemId: "pasta", quantity: 1 }];
const order = (id: string, status: Order["status"], version: number) =>
  ({ id, status, version }) as Order;

describe("createOrderIntentStore", () => {
  test("the same cart reuses the order key", () => {
    const store = createOrderIntentStore(memoryKv());
    const newKey = vi.fn(() => "k1");
    store.start(lines, "cashier-campus-1", newKey);
    expect(store.start(lines, "cashier-campus-1", newKey).key).toBe("k1");
    expect(newKey).toHaveBeenCalledTimes(1);
  });

  test("a different cart before an order exists gets a new key", () => {
    const store = createOrderIntentStore(memoryKv());
    store.start(lines, "cashier-campus-1", () => "k1");
    expect(
      store.start([{ itemId: "salad", quantity: 1 }], "cashier-campus-1", () => "k2").key,
    ).toBe("k2");
  });

  test("the created order and its last known state survive a relaunch", () => {
    const kv = memoryKv();
    createOrderIntentStore(kv).start(lines, "cashier-campus-1", () => "k1");
    createOrderIntentStore(kv).orderCreated(order("ord_1", "open", 1));
    expect(createOrderIntentStore(kv).current()).toEqual({
      key: "k1",
      lines,
      cashier: "cashier-campus-1",
      orderId: "ord_1",
      order: order("ord_1", "open", 1),
    });
  });

  test("a polled order replaces the saved state only when it is newer", () => {
    const store = createOrderIntentStore(memoryKv());
    store.start(lines, "cashier-campus-1", () => "k1");
    store.orderCreated(order("ord_1", "open", 1));
    store.remember(order("ord_1", "paid", 3));
    store.remember(order("ord_1", "paying", 2));
    expect(store.current()?.order).toEqual(order("ord_1", "paid", 3));
  });

  test("a polled order for another id leaves the saved state alone", () => {
    const store = createOrderIntentStore(memoryKv());
    store.start(lines, "cashier-campus-1", () => "k1");
    store.orderCreated(order("ord_1", "open", 1));
    store.remember(order("ord_2", "paid", 5));
    expect(store.current()?.order).toEqual(order("ord_1", "open", 1));
  });

  test("the same cart after an order was created gets a new key, not the old order", () => {
    const store = createOrderIntentStore(memoryKv());
    store.start(lines, "cashier-campus-1", () => "k1");
    store.orderCreated(order("ord_1", "open", 1));
    expect(store.start(lines, "cashier-campus-1", () => "k2").key).toBe("k2");
  });

  test("clear forgets the order", () => {
    const store = createOrderIntentStore(memoryKv());
    store.start(lines, "cashier-campus-1", () => "k1");
    store.clear();
    expect(store.current()).toBeUndefined();
  });

  test("an open order is resumed only for the cashier who rang it up", () => {
    const store = createOrderIntentStore(memoryKv());
    store.start(lines, "cashier-campus-1", () => "k1");
    store.orderCreated(order("ord_1", "open", 1));
    expect(store.openOrderFor("cashier-campus-1")).toBe("ord_1");
    expect(store.openOrderFor("cashier-campus-2")).toBeUndefined();
  });

  test("an attempt without an order yet has nothing to resume", () => {
    const store = createOrderIntentStore(memoryKv());
    store.start(lines, "cashier-campus-1", () => "k1");
    expect(store.openOrderFor("cashier-campus-1")).toBeUndefined();
  });
});
