import { expect, test } from "vitest";

import { parseOrderQr } from "../qr";

test("reads the order id from a till QR", () => {
  expect(parseOrderQr("zahln://pay?order=ord_62168a5b69c4502d")).toBe("ord_62168a5b69c4502d");
});

test("accepts a bare order id typed by hand", () => {
  expect(parseOrderQr("  ord_62168a5b69c4502d ")).toBe("ord_62168a5b69c4502d");
});

test("rejects QR codes from anywhere else", () => {
  expect(parseOrderQr("https://evil.example/pay?order=ord_1")).toBeNull();
  expect(parseOrderQr("zahln://pay?order=../../x")).toBeNull();
  expect(parseOrderQr("hello")).toBeNull();
});
