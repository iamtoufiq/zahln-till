import { expect, test } from "vitest";

import { formatCountdown } from "../countdown";

test("formats seconds as minutes and seconds", () => {
  expect(formatCountdown(300)).toBe("5:00");
  expect(formatCountdown(65)).toBe("1:05");
  expect(formatCountdown(0)).toBe("0:00");
  expect(formatCountdown(-3)).toBe("0:00");
});
