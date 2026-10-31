import { expect, test } from "vitest";

import { newer } from "../version";

test("keeps the higher version", () => {
  const held = { id: "o1", status: "paid", version: 3 };
  expect(newer(held, { id: "o1", status: "paying", version: 2 })).toBe(held);
});

test("takes an equal or higher version", () => {
  const incoming = { id: "o1", status: "paid", version: 3 };
  expect(newer({ id: "o1", status: "paying", version: 3 }, incoming)).toBe(incoming);
  expect(newer({ id: "o1", status: "open", version: 1 }, incoming)).toBe(incoming);
});

test("takes the incoming one when nothing is held", () => {
  const incoming = { version: 1 };
  expect(newer(undefined, incoming)).toBe(incoming);
});
