import { expect, test } from "vitest";

import { secondsLeft } from "../order-time";

const at = Date.parse("2026-10-29T04:26:41.763Z");
const order = { createdAt: "2026-10-29T04:21:41.763Z", expiresAt: "2026-10-29T04:26:41.763Z" };

test("counts whole seconds until expiry", () => {
  expect(secondsLeft(order, at - 90_500)).toBe(90);
});

test("a past expiry is zero", () => {
  expect(secondsLeft(order, at + 5000)).toBe(0);
});

// The server clock comes from the Date header, which drops milliseconds, so it can run
// up to a second behind. The count never shows more than the order's own lifetime.
test("never counts above the order's lifetime", () => {
  expect(secondsLeft(order, at - 300_900)).toBe(300);
});

test("an unreadable createdAt still lets the order expire", () => {
  expect(secondsLeft({ ...order, createdAt: "" }, at + 5000)).toBe(0);
  expect(secondsLeft({ ...order, createdAt: "" }, at - 90_500)).toBe(90);
});
