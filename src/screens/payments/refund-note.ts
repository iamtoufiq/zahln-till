import type { Payment } from "@/api/payments/interface";
import type { MessageKey } from "@/core";

// What the payments list says about refunds. A refund still running is what the cashier
// has to watch, so it is shown before the ones already completed.
export function refundNote(payment: Payment): { key: MessageKey; cents: number } | null {
  if (payment.pendingRefundAmountCents > 0)
    return { key: "payments.refundPending", cents: payment.pendingRefundAmountCents };
  if (payment.refundedAmountCents > 0)
    return { key: "payments.refunded", cents: payment.refundedAmountCents };
  return null;
}
