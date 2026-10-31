type OrderTimes = { createdAt: string; expiresAt: string };

// Capped at the order's lifetime: the server clock is read from the Date header, which has no
// milliseconds, so without the cap a fresh order could briefly show one second too many.
export function secondsLeft(order: OrderTimes, nowMs: number): number {
  const expiresMs = Date.parse(order.expiresAt);
  const left = Math.floor((expiresMs - nowMs) / 1000);
  const lifetime = Math.floor((expiresMs - Date.parse(order.createdAt)) / 1000);
  return Math.max(0, Number.isFinite(lifetime) ? Math.min(lifetime, left) : left);
}
