import { afterEach, expect, test, vi } from "vitest";

import { createServerClock } from "../clock";

afterEach(() => vi.useRealTimers());

test("now follows the server Date header, not the device clock", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-29T04:01:00Z"));
  const clock = createServerClock();

  clock.observe("Thu, 29 Oct 2026 04:00:00 GMT");

  expect(Math.abs(clock.now() - Date.parse("2026-10-29T04:00:00Z"))).toBeLessThanOrEqual(1000);
});

test("without any header now is the device clock", () => {
  const clock = createServerClock();
  expect(Math.abs(clock.now() - Date.now())).toBeLessThan(50);
});

test("an unparseable header is ignored", () => {
  const clock = createServerClock();
  clock.observe("garbage");
  expect(Math.abs(clock.now() - Date.now())).toBeLessThan(50);
});
