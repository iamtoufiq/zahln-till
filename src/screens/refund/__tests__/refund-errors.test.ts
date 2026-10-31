import { describe, expect, test } from "vitest";

import { ApiError } from "@/api/errors";

import { isRefusal, parseRefundInput, refundMessageKey, validateRefund } from "../refund-errors";

const rejected = (status: number, code: string) => new ApiError(status, code, false, "rejected");

describe("refundMessageKey", () => {
  test("each refusal from the server has its own message", () => {
    expect(refundMessageKey(rejected(422, "refund_window_closed"))).toBe(
      "refundError.refund_window_closed",
    );
    expect(refundMessageKey(rejected(409, "refund_exceeds_payment"))).toBe(
      "refundError.refund_exceeds_payment",
    );
    expect(refundMessageKey(rejected(422, "payment_not_refundable"))).toBe(
      "refundError.payment_not_refundable",
    );
    expect(refundMessageKey(rejected(403, "forbidden"))).toBe("refundError.forbidden");
  });

  test("anything else is the generic message", () => {
    expect(refundMessageKey(rejected(400, "invalid_request"))).toBe("error.generic");
  });
});

describe("validateRefund", () => {
  test("rejects an empty amount", () => {
    expect(validateRefund(null, 490)).toBe("refundError.empty");
  });

  test("rejects more than is refundable", () => {
    expect(validateRefund(500, 490)).toBe("refundError.tooMuch");
  });

  test("accepts up to the refundable amount", () => {
    expect(validateRefund(490, 490)).toBeNull();
    expect(validateRefund(100, 490)).toBeNull();
  });
});

describe("parseRefundInput", () => {
  test("an empty field asks for an amount", () => {
    expect(parseRefundInput("  ")).toEqual({ error: "refundError.empty" });
  });

  test("text that is not a euro amount says so, instead of asking for an amount", () => {
    expect(parseRefundInput("1.234,50")).toEqual({ error: "refundError.invalid" });
    expect(parseRefundInput("5,")).toEqual({ error: "refundError.invalid" });
    expect(parseRefundInput("abc")).toEqual({ error: "refundError.invalid" });
  });

  test("a euro amount with a comma or a dot is read in cents", () => {
    expect(parseRefundInput("2,50")).toEqual({ cents: 250 });
    expect(parseRefundInput("2.5")).toEqual({ cents: 250 });
  });
});

describe("isRefusal", () => {
  test("a server refusal ends the attempt, including a key that no longer matches", () => {
    expect(isRefusal(rejected(422, "idempotency_mismatch"))).toBe(true);
    expect(isRefusal(rejected(409, "refund_exceeds_payment"))).toBe(true);
  });

  test("an unknown or unapplied answer keeps the attempt for a resend", () => {
    expect(isRefusal(new ApiError(504, "timeout", true, "unknown"))).toBe(false);
    expect(isRefusal(new ApiError(503, "unavailable", true, "not_applied"))).toBe(false);
  });
});
