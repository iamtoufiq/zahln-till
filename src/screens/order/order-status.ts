import type { ApiError } from "@/api/errors";
import type { Order } from "@/api/orders/interface";
import { newer } from "@/core";

export type TillView = "waiting" | "paying" | "paid" | "expired";

export const reduceOrder = (held: Order | undefined, incoming: Order): Order =>
  newer(held, incoming);

// Only the server ends an order: a student may still be paying when the local countdown hits zero.
export const isFinal = (order: Order) => order.status === "paid" || order.status === "expired";

const OFFLINE_AFTER_FAILURES = 2;

// The API has no declined order status: a declined payment puts the order back to open.
export const declinedNow = (held: Order | undefined, next: Order) =>
  held?.status === "paying" && next.status === "open";

// Another cashier's order, or one the server dropped, will never answer this till again.
export const orderGone = (error: ApiError) =>
  error.code === "not_found" || error.code === "forbidden";

// The server can change an order without a new version (expiry is decided at read time),
// so a poll counts as a change when the status or payment differs, not only the version.
export const changedOrder = (held: Order | undefined, next: Order) =>
  !held ||
  held.version !== next.version ||
  held.status !== next.status ||
  held.paymentId !== next.paymentId;

export const isOffline = (failedPolls: number) => failedPolls >= OFFLINE_AFTER_FAILURES;

export function tillView(order: Order): TillView {
  if (order.status === "paid") return "paid";
  if (order.status === "paying") return "paying";
  if (order.status === "expired") return "expired";
  return "waiting";
}
