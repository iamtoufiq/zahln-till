// Dev builds only: one console line per request and per answer, for the DevTools Console tab.
// Passwords and access tokens are masked before printing.
const SECRETS = /("(?:password|accessToken)"\s*:\s*)"[^"]*"/g;
const short = (text: string) => {
  const safe = text.replace(SECRETS, '$1"***"');
  return safe.length > 300 ? safe.slice(0, 300) + "…" : safe;
};

export function logRequests(real: typeof fetch): typeof fetch {
  return async (input, init) => {
    const url = new URL(String(input));
    const path = url.pathname + url.search;
    const method = init?.method ?? "GET";
    const key = new Headers(init?.headers).get("Idempotency-Key");
    const body = typeof init?.body === "string" ? ` ${short(init.body)}` : "";
    console.log(`→ ${method} ${path}${key ? `  key=${key}` : ""}${body}`);
    const started = Date.now();
    try {
      const res = await real(input, init);
      const text = await res.clone().text();
      console.log(`← ${res.status} ${method} ${path}  ${Date.now() - started}ms  ${short(text)}`);
      return res;
    } catch (error) {
      console.log(`✕ ${method} ${path}  ${Date.now() - started}ms  ${String(error)}`);
      throw error;
    }
  };
}
