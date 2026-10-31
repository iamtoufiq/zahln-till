import { describe, expect, test } from "vitest";

import type { Order } from "@/api/orders/interface";

import { ApiError } from "@/api/errors";

import {
  changedOrder,
  declinedNow,
  isFinal,
  isOffline,
  orderGone,
  reduceOrder,
  tillView,
} from "../order-status";

const order = (status: Order["status"], version: number) =>
  ({ id: "ord_1", status, version, expiresAt: "2026-10-29T04:26:00Z" }) as Order;

describe("order status on the till", () => {
  test("a stale poll never downgrades a paid order", () => {
    const paid = order("paid", 3);
    expect(reduceOrder(paid, order("paying", 2))).toBe(paid);
  });

  test("open before expiry is waiting", () => {
    expect(tillView(order("open", 1))).toBe("waiting");
  });

  test("open past expiresAt keeps waiting until the server says expired", () => {
    expect(tillView(order("open", 1))).toBe("waiting");
  });

  test("the server's expired status is expired", () => {
    expect(tillView(order("expired", 2))).toBe("expired");
  });

  test("only paid and expired from the server stop polling", () => {
    expect(isFinal(order("open", 1))).toBe(false);
    expect(isFinal(order("paying", 2))).toBe(false);
    expect(isFinal(order("paid", 3))).toBe(true);
    expect(isFinal(order("expired", 2))).toBe(true);
  });

  test("paying stays paying even after expiresAt, the payment decides", () => {
    expect(tillView(order("paying", 2))).toBe("paying");
  });

  test("paid is paid", () => {
    expect(tillView(order("paid", 3))).toBe("paid");
  });

  test("paying going back to open means the payment was declined", () => {
    expect(declinedNow(order("paying", 2), order("open", 3))).toBe(true);
    expect(declinedNow(order("open", 1), order("open", 1))).toBe(false);
    expect(declinedNow(undefined, order("open", 1))).toBe(false);
    expect(declinedNow(order("paying", 2), order("paid", 3))).toBe(false);
  });

  test("an order this till may not see any more is gone, a slow server is not", () => {
    expect(orderGone(new ApiError(404, "not_found", false, "rejected"))).toBe(true);
    expect(orderGone(new ApiError(403, "forbidden", false, "rejected"))).toBe(true);
    expect(orderGone(new ApiError(504, "timeout", true, "unknown"))).toBe(false);
    expect(orderGone(new ApiError(null, "network", true, "unknown"))).toBe(false);
  });

  test("the till warns about the connection after two failed polls in a row", () => {
    expect(isOffline(0)).toBe(false);
    expect(isOffline(1)).toBe(false);
    expect(isOffline(2)).toBe(true);
  });

  test("an order the server expires without a new version still counts as changed", () => {
    // The mock turns open v1 into expired v1 when the time runs out; the QR must still end.
    expect(changedOrder(order("open", 1), order("expired", 1))).toBe(true);
  });

  test("the same status and version is no change, so a poll skips the render", () => {
    expect(changedOrder(order("open", 1), order("open", 1))).toBe(false);
  });

  test("a first answer with nothing held is a change", () => {
    expect(changedOrder(undefined, order("open", 1))).toBe(true);
  });
});
