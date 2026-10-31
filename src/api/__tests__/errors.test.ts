import { describe, expect, test } from "vitest";

import { toApiError } from "../errors";

const problem = (status: number, code: string, retryable: boolean) =>
  new Response(JSON.stringify({ code, title: code, status, retryable }), {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });

describe("toApiError", () => {
  test("504 timeout is an unknown outcome", async () => {
    const res = problem(504, "timeout", true);
    const error = toApiError(res, await res.json());
    expect(error.outcome).toBe("unknown");
    expect(error.retryable).toBe(true);
  });

  test("503 unavailable was not applied and can be retried", async () => {
    const res = problem(503, "unavailable", true);
    const error = toApiError(res, await res.json());
    expect(error.outcome).toBe("not_applied");
    expect(error.retryable).toBe(true);
  });

  test("503 payments_disabled is a rejection", async () => {
    const res = problem(503, "payments_disabled", false);
    const error = toApiError(res, await res.json());
    expect(error.outcome).toBe("rejected");
    expect(error.code).toBe("payments_disabled");
  });

  test("409 amount_mismatch is a rejection with its code", async () => {
    const res = problem(409, "amount_mismatch", false);
    const error = toApiError(res, await res.json());
    expect(error.outcome).toBe("rejected");
    expect(error.code).toBe("amount_mismatch");
    expect(error.retryable).toBe(false);
  });

  test("a 500 from a proxy is an unknown outcome, not a refusal", async () => {
    const res = problem(500, "internal", false);
    expect(toApiError(res, await res.json()).outcome).toBe("unknown");
  });

  test("a 408 request timeout is an unknown outcome", () => {
    expect(toApiError(new Response(null, { status: 408 }), null).outcome).toBe("unknown");
  });

  test("a thrown network error is an unknown outcome with no status", () => {
    const error = toApiError(null, null, new TypeError("Network request failed"));
    expect(error.outcome).toBe("unknown");
    expect(error.status).toBeNull();
    expect(error.code).toBe("network");
  });

  test("a 502 without a problem body is still an unknown outcome", () => {
    const res = new Response("bad gateway", { status: 502 });
    const error = toApiError(res, null);
    expect(error.outcome).toBe("unknown");
    expect(error.code).toBe("connection_dropped");
  });
});
