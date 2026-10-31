import { describe, expect, test, vi } from "vitest";

import { createClient } from "../client";
import { createServerClock } from "../clock";
import { ApiError } from "../errors";
import { createSession } from "../session";
import type { Session } from "../interface";

type Scripted = { status: number; body?: unknown; headers?: Record<string, string> } | "throw";

function fakeFetch(script: Scripted[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = script.shift();
    if (!next || next === "throw") throw new TypeError("Network request failed");
    return new Response(next.body === undefined ? null : JSON.stringify(next.body), {
      status: next.status,
      headers: { "Content-Type": "application/json", ...next.headers },
    });
  });
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls };
}

const header = (init: RequestInit, name: string) => new Headers(init.headers).get(name);
const problem = (status: number, code: string, retryable: boolean) => ({
  status,
  body: { code, title: code, status, retryable },
});

function setup(
  script: Scripted[],
  login = vi.fn(async () => ({ accessToken: "fresh" }) as Session),
) {
  const { fetch, calls } = fakeFetch(script);
  const session = createSession(login);
  session.set({ accessToken: "old" } as Session);
  const clock = createServerClock();
  const client = createClient({
    baseUrl: "https://api.test",
    candidateId: "c_test",
    appVersion: "1.0.0",
    session,
    clock,
    fetch,
    retryDelayMs: () => 0,
  });
  return { client, calls, login, clock, session };
}

describe("createClient", () => {
  test("retries a POST with the same Idempotency-Key until 201", async () => {
    const { client, calls } = setup([
      problem(504, "timeout", true),
      problem(502, "connection_dropped", true),
      { status: 201, body: { id: "pay_1" }, headers: { "Idempotent-Replayed": "true" } },
    ]);

    const result = await client.request("POST", "/orders/o1/payments", {
      body: { amountCents: 220 },
      idempotencyKey: "k1",
    });

    expect(calls).toHaveLength(3);
    expect(calls.map((c) => header(c.init, "Idempotency-Key"))).toEqual(["k1", "k1", "k1"]);
    expect(result).toEqual({ data: { id: "pay_1" }, replayed: true });
  });

  test("does not retry a POST without a key", async () => {
    const { client, calls } = setup([problem(504, "timeout", true), { status: 201, body: {} }]);
    await expect(client.request("POST", "/sessions", { body: {} })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(calls).toHaveLength(1);
  });

  test("does not retry a rejected 409", async () => {
    const { client, calls } = setup([problem(409, "amount_mismatch", false)]);
    await expect(
      client.request("POST", "/orders/o1/payments", { body: {}, idempotencyKey: "k1" }),
    ).rejects.toMatchObject({ code: "amount_mismatch", outcome: "rejected" });
    expect(calls).toHaveLength(1);
  });

  test("retries a GET after a dropped connection", async () => {
    const { client, calls } = setup(["throw", { status: 200, body: { ok: true } }]);
    const result = await client.request("GET", "/config");
    expect(calls).toHaveLength(2);
    expect(result.data).toEqual({ ok: true });
  });

  test("sends X-Candidate-Id and the bearer token on every call", async () => {
    const { client, calls } = setup([{ status: 200, body: {} }]);
    await client.request("GET", "/mensas");
    expect(header(calls[0]!.init, "X-Candidate-Id")).toBe("c_test");
    expect(header(calls[0]!.init, "Authorization")).toBe("Bearer old");
  });

  test("sends X-App-Version only when asked", async () => {
    const { client, calls } = setup([
      { status: 200, body: {} },
      { status: 201, body: {} },
    ]);
    await client.request("GET", "/config");
    await client.request("POST", "/x", { body: {}, idempotencyKey: "k", sendAppVersion: true });
    expect(header(calls[0]!.init, "X-App-Version")).toBeNull();
    expect(header(calls[1]!.init, "X-App-Version")).toBe("1.0.0");
  });

  test("adds query parameters and skips undefined ones", async () => {
    const { client, calls } = setup([{ status: 200, body: {} }]);
    await client.request("GET", "/payments", {
      query: { status: "pending", q: undefined, limit: 20 },
    });
    expect(calls[0]!.url).toBe("https://api.test/payments?status=pending&limit=20");
  });

  test("re-logs in once on session_expired and replays", async () => {
    const { client, calls, login } = setup([
      problem(401, "session_expired", false),
      { status: 200, body: { ok: true } },
    ]);
    const result = await client.request("GET", "/mensas");
    expect(login).toHaveBeenCalledTimes(1);
    expect(header(calls[1]!.init, "Authorization")).toBe("Bearer fresh");
    expect(result.data).toEqual({ ok: true });
  });

  test("a token the server no longer knows signs in again, like an expired one", async () => {
    const { client, calls, login } = setup([
      problem(401, "unauthorized", false),
      { status: 200, body: { ok: true } },
    ]);
    const result = await client.request("GET", "/payments");
    expect(login).toHaveBeenCalledTimes(1);
    expect(header(calls[1]!.init, "Authorization")).toBe("Bearer fresh");
    expect(result.data).toEqual({ ok: true });
  });

  test("a 401 on sign-in itself is a refusal, not a reason to sign in again", async () => {
    const { client, login } = setup([problem(401, "invalid_credentials", false)]);
    await expect(
      client.request("POST", "/sessions", { body: {}, anonymous: true }),
    ).rejects.toMatchObject({ code: "invalid_credentials" });
    expect(login).not.toHaveBeenCalled();
  });

  test("a 401 for a token another request already replaced retries without a second login", async () => {
    const { client, calls, login, session } = setup([
      problem(401, "session_expired", false),
      { status: 200, body: { ok: true } },
    ]);
    const first = client.request("GET", "/mensas");
    session.set({ accessToken: "refreshed-elsewhere" } as Session);

    await expect(first).resolves.toMatchObject({ data: { ok: true } });
    expect(login).not.toHaveBeenCalled();
    expect(header(calls[1]!.init, "Authorization")).toBe("Bearer refreshed-elsewhere");
  });

  test("a request without a token signs in first, then sends with the new token", async () => {
    const { client, calls, login, session } = setup([{ status: 200, body: { ok: true } }]);
    session.clear();

    await client.request("GET", "/mensas");

    expect(login).toHaveBeenCalledTimes(1);
    expect(header(calls[0]!.init, "Authorization")).toBe("Bearer fresh");
  });

  test("signing in itself does not wait for a token", async () => {
    const { client, login, session } = setup([{ status: 201, body: { accessToken: "x" } }]);
    session.clear();

    await client.request("POST", "/sessions", { body: {}, anonymous: true });

    expect(login).not.toHaveBeenCalled();
  });

  test("observes the Date header into the clock", async () => {
    const { client, clock } = setup([
      { status: 200, body: {}, headers: { Date: "Thu, 29 Oct 2026 04:00:00 GMT" } },
    ]);
    await client.request("GET", "/config");
    expect(Math.abs(clock.now() - Date.parse("2026-10-29T04:00:00Z"))).toBeLessThanOrEqual(1000);
  });

  test("a refusal after an attempt whose answer was lost is reported as unknown", async () => {
    const { client } = setup([
      problem(504, "timeout", true),
      problem(401, "session_expired", false),
      problem(401, "session_expired", false),
    ]);
    await expect(
      client.request("POST", "/orders/o1/payments", { body: {}, idempotencyKey: "k" }),
    ).rejects.toMatchObject({ code: "session_expired", outcome: "unknown" });
  });

  test("a refusal on the first answer stays a refusal", async () => {
    const { client } = setup([problem(409, "order_expired", false)]);
    await expect(
      client.request("POST", "/orders/o1/payments", { body: {}, idempotencyKey: "k" }),
    ).rejects.toMatchObject({ code: "order_expired", outcome: "rejected" });
  });

  test("gives up after maxAttempts and throws the unknown outcome", async () => {
    const { client, calls } = setup(["throw", "throw", "throw", "throw", "throw"]);
    await expect(
      client.request("POST", "/orders", { body: {}, idempotencyKey: "k" }),
    ).rejects.toMatchObject({ outcome: "unknown" });
    expect(calls).toHaveLength(4);
  });
});
