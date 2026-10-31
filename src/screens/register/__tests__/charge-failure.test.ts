import { describe, expect, test } from "vitest";

import { ApiError } from "@/api/errors";

import { chargeFailure } from "../charge-failure";

describe("chargeFailure", () => {
  test("a refusal means no order was created", () => {
    expect(chargeFailure(new ApiError(400, "invalid_request", false, "rejected"))).toBe("refused");
  });

  test("a lost answer may have created the order", () => {
    expect(chargeFailure(new ApiError(504, "timeout", true, "unknown"))).toBe("unknown");
    expect(chargeFailure(new ApiError(503, "unavailable", true, "not_applied"))).toBe("unknown");
  });

  test("an unexpected error is treated as unknown, never as nothing happened", () => {
    expect(chargeFailure(new TypeError("Cannot read properties of null"))).toBe("unknown");
  });
});
