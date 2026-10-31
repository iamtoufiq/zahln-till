const ORDER_ID = /^ord_[A-Za-z0-9]+$/;
const QR_PREFIX = "zahln://pay?order=";

export function parseOrderQr(text: string): string | null {
  const trimmed = text.trim();
  const id = trimmed.startsWith(QR_PREFIX) ? trimmed.slice(QR_PREFIX.length) : trimmed;
  return ORDER_ID.test(id) ? id : null;
}
