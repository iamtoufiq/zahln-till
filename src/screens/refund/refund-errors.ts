import type { ApiError } from "@/api/errors";
import { type MessageKey, parseEuroInput } from "@/core";

const REFUSALS = new Set([
  "refund_exceeds_payment",
  "payment_not_refundable",
  "refund_window_closed",
  "forbidden",
  "idempotency_mismatch",
]);

export function refundMessageKey(error: ApiError): MessageKey {
  return REFUSALS.has(error.code) ? (`refundError.${error.code}` as MessageKey) : "error.generic";
}

// Any refusal ends the attempt; the body cannot change under one key, so a mismatch is not retried.
export const isRefusal = (error: ApiError) => error.outcome === "rejected";

export function parseRefundInput(text: string): { cents: number } | { error: MessageKey } {
  if (!text.trim()) return { error: "refundError.empty" };
  const cents = parseEuroInput(text);
  return cents === null ? { error: "refundError.invalid" } : { cents };
}

export function validateRefund(
  amountCents: number | null,
  refundableCents: number,
): MessageKey | null {
  if (amountCents === null) return "refundError.empty";
  if (amountCents > refundableCents) return "refundError.tooMuch";
  return null;
}
