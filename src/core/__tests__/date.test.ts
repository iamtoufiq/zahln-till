import { expect, test } from "vitest";

import { formatDateTime } from "../date";

const plain = (s: string) => s.replace(/ | /g, " ");

test("shows mensa time in Berlin, whatever the device zone", () => {
  expect(plain(formatDateTime("2026-10-29T11:05:00Z", "de"))).toBe("29.10.2026, 12:05");
  expect(plain(formatDateTime("2026-10-29T11:05:00Z", "en"))).toBe("29 Oct 2026, 12:05");
});
