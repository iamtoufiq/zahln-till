import { describe, expect, test, vi } from "vitest";

import { createFaultyFetch, type FaultMode } from "../faults";

function realFetch() {
  let n = 0;
  return vi.fn(async () => new Response(JSON.stringify({ n: ++n }), { status: 200 }));
}

describe("createFaultyFetch", () => {
  test("off passes the request straight through", async () => {
    const real = realFetch();
    const faulty = createFaultyFetch(real as unknown as typeof fetch, () => "off");
    const res = await faulty("https://x/config", { method: "GET" });
    expect(await res.json()).toEqual({ n: 1 });
  });

  test("lose_response sends a POST and still throws", async () => {
    const real = realFetch();
    const faulty = createFaultyFetch(real as unknown as typeof fetch, () => "lose_response");
    const init = { method: "POST", headers: { "Idempotency-Key": "k1" } };
    await expect(faulty("https://x/orders", init)).rejects.toThrow(TypeError);
    expect(real).toHaveBeenCalledTimes(1);
  });

  test("lose_response lets the retry with the same key through", async () => {
    const real = realFetch();
    const faulty = createFaultyFetch(real as unknown as typeof fetch, () => "lose_response");
    const init = { method: "POST", headers: { "Idempotency-Key": "k1" } };
    await expect(faulty("https://x/orders", init)).rejects.toThrow(TypeError);
    const res = await faulty("https://x/orders", init);
    expect(res.status).toBe(200);
  });

  test("lose_response leaves GETs alone", async () => {
    const real = realFetch();
    const faulty = createFaultyFetch(real as unknown as typeof fetch, () => "lose_response");
    const res = await faulty("https://x/orders/o1", { method: "GET" });
    expect(res.status).toBe(200);
  });

  test("fail_503 refuses writes before they reach the server", async () => {
    const real = realFetch();
    const faulty = createFaultyFetch(real as unknown as typeof fetch, () => "fail_503");
    const res = await faulty("https://x/orders", { method: "POST" });
    expect(res.status).toBe(503);
    expect(real).not.toHaveBeenCalled();
  });

  test("fail_503 lets reads through", async () => {
    const real = realFetch();
    const faulty = createFaultyFetch(real as unknown as typeof fetch, () => "fail_503");
    const res = await faulty("https://x/orders/o1", { method: "GET" });
    expect(res.status).toBe(200);
  });

  test("stale returns the earlier body for the same GET", async () => {
    const real = realFetch();
    let mode: FaultMode = "off";
    const faulty = createFaultyFetch(real as unknown as typeof fetch, () => mode);
    await faulty("https://x/orders/o1", { method: "GET" });
    await faulty("https://x/orders/o1", { method: "GET" });
    mode = "stale";
    const res = await faulty("https://x/orders/o1", { method: "GET" });
    expect(await res.json()).toEqual({ n: 1 });
  });
});
