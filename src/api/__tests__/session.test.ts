import { describe, expect, test, vi } from "vitest";

import { createSession } from "../session";
import type { Session } from "../interface";

const session = (token: string) => ({ accessToken: token }) as Session;

describe("createSession", () => {
  test("concurrent 401s share one login", async () => {
    const login = vi.fn(async () => session("t2"));
    const s = createSession(login);

    const [a, b] = await Promise.all([s.refresh(), s.refresh()]);

    expect(login).toHaveBeenCalledTimes(1);
    expect(a).toBe("t2");
    expect(b).toBe("t2");
    expect(s.token()).toBe("t2");
  });

  test("a later refresh logs in again", async () => {
    const login = vi.fn(async () => session("t" + login.mock.calls.length));
    const s = createSession(login);

    await s.refresh();
    await s.refresh();

    expect(login).toHaveBeenCalledTimes(2);
  });

  test("clear drops the token", () => {
    const s = createSession(async () => session("x"));
    s.set(session("t1"));
    s.clear();
    expect(s.token()).toBeNull();
  });
});
