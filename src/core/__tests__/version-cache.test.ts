import { expect, test } from "vitest";

import { createVersionCache } from "../version-cache";

const item = (id: string, version: number, status: string) => ({ id, version, status });

test("a later stale copy of an item never replaces a newer one", () => {
  const cache = createVersionCache<ReturnType<typeof item>>();
  cache.keep(item("pay_1", 3, "confirmed"));
  expect(cache.keep(item("pay_1", 2, "pending"))).toEqual(item("pay_1", 3, "confirmed"));
});

test("items are kept apart by id", () => {
  const cache = createVersionCache<ReturnType<typeof item>>();
  cache.keep(item("pay_1", 5, "confirmed"));
  expect(cache.keep(item("pay_2", 1, "pending"))).toEqual(item("pay_2", 1, "pending"));
});

test("an equal or higher version replaces the cached one", () => {
  const cache = createVersionCache<ReturnType<typeof item>>();
  cache.keep(item("pay_1", 1, "pending"));
  expect(cache.keep(item("pay_1", 2, "confirmed")).status).toBe("confirmed");
});
