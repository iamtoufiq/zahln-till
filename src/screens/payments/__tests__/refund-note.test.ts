import { expect, test } from "vitest";

import type { Payment } from "@/api/payments/interface";

import { refundNote } from "../refund-note";

const payment = (refundedAmountCents: number, pendingRefundAmountCents: number) =>
  ({ amountCents: 880, refundedAmountCents, pendingRefundAmountCents }) as Payment;

test("a payment with no refund shows no note", () => {
  expect(refundNote(payment(0, 0))).toBeNull();
});

test("a completed refund shows how much went back", () => {
  expect(refundNote(payment(100, 0))).toEqual({ key: "payments.refunded", cents: 100 });
});

// A refund still running is what the cashier has to watch, so it wins over completed ones.
test("a refund in progress is shown before completed ones", () => {
  expect(refundNote(payment(100, 50))).toEqual({ key: "payments.refundPending", cents: 50 });
});
