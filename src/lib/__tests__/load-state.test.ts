import { describe, expect, test } from "vitest";

import { loadState } from "../load-state";

describe("loadState", () => {
  test("a first load that fails has nothing to show", () => {
    expect(loadState({ isError: true, data: undefined })).toEqual({
      failed: true,
      reconnecting: false,
    });
  });

  test("a failed refetch keeps the last data and only says it is reconnecting", () => {
    expect(loadState({ isError: true, data: { id: "pay_1" } })).toEqual({
      failed: false,
      reconnecting: true,
    });
  });

  test("a healthy query is neither", () => {
    expect(loadState({ isError: false, data: { id: "pay_1" } })).toEqual({
      failed: false,
      reconnecting: false,
    });
  });
});
