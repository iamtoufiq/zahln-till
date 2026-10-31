export type FaultMode = "off" | "slow" | "fail_503" | "lose_response" | "stale";

export const FAULT_MODES: FaultMode[] = ["off", "slow", "fail_503", "lose_response", "stale"];

const SLOW_MS = 4000;
const unavailable = () =>
  new Response(
    JSON.stringify({ code: "unavailable", title: "Injected", status: 503, retryable: true }),
    { status: 503, headers: { "Content-Type": "application/problem+json" } },
  );

// Dev-only: reproduces the mock's network failures on demand.
export function createFaultyFetch(real: typeof fetch, mode: () => FaultMode): typeof fetch {
  const firstSeen = new Map<string, { status: number; body: string; headers: Headers }>();
  const lostKeys = new Set<string>();

  return async (input, init) => {
    const url = String(input);
    const isGet = (init?.method ?? "GET") === "GET";
    const current = mode();

    if (current === "fail_503" && !isGet) return unavailable();
    if (current === "stale" && isGet) {
      const old = firstSeen.get(url);
      if (old) return new Response(old.body, { status: old.status, headers: old.headers });
    }
    if (current === "slow") await new Promise((resolve) => setTimeout(resolve, SLOW_MS));

    const res = await real(input, init);
    // Loses the first answer per Idempotency-Key: the server acted, the phone never heard.
    const key = new Headers(init?.headers).get("Idempotency-Key");
    if (current === "lose_response" && key && !lostKeys.has(key)) {
      lostKeys.add(key);
      throw new TypeError("Network request failed");
    }
    if (isGet && res.ok && !firstSeen.has(url)) {
      const body = await res.clone().text();
      firstSeen.set(url, { status: res.status, body, headers: res.headers });
    }
    return res;
  };
}
