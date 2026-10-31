import { expect, test } from "vitest";

import { formatCents, parseEuroInput } from "../money";

const plain = (s: string) => s.replace(/ | /g, " ");

test("formats cents for German and English", () => {
  expect(plain(formatCents(220, "de"))).toBe("2,20 €");
  expect(formatCents(220, "en")).toBe("€2.20");
});

test("parses a euro amount typed with a comma or a dot", () => {
  expect(parseEuroInput("2,2")).toBe(220);
  expect(parseEuroInput("2.20")).toBe(220);
  expect(parseEuroInput("1,00")).toBe(100);
  expect(parseEuroInput(" 4 ")).toBe(400);
});

test("rejects empty, zero, negative and malformed amounts", () => {
  expect(parseEuroInput("")).toBeNull();
  expect(parseEuroInput("abc")).toBeNull();
  expect(parseEuroInput("0")).toBeNull();
  expect(parseEuroInput("-1")).toBeNull();
  expect(parseEuroInput("1.234")).toBeNull();
});
