import type { ServerClock } from "./clock";
import { ApiError, toApiError } from "./errors";
import type { SessionHandle } from "./session";

type Method = "GET" | "POST";
type Query = Record<string, string | number | boolean | undefined>;

export type RequestInit = {
  query?: Query;
  body?: unknown;
  idempotencyKey?: string;
  sendAppVersion?: boolean;
  anonymous?: boolean;
  maxAttempts?: number;
  timeoutMs?: number;
};

export type ApiResult<T> = { data: T; replayed: boolean };

type ClientOptions = {
  baseUrl: string;
  candidateId: string;
  appVersion?: string;
  session: SessionHandle;
  clock: ServerClock;
  fetch?: typeof fetch;
  timeoutMs?: number;
  maxAttempts?: number;
  retryDelayMs?: (attempt: number) => number;
};

export type Client = ReturnType<typeof createClient>;

const backoff = (attempt: number) => 500 * 2 ** attempt + Math.random() * 250;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildUrl(baseUrl: string, path: string, query?: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const search = params.toString();
  return baseUrl + path + (search ? "?" + search : "");
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function createClient(options: ClientOptions) {
  const {
    baseUrl,
    candidateId,
    appVersion,
    session,
    clock,
    fetch: doFetch = fetch,
    timeoutMs = 15000,
    maxAttempts = 4,
    retryDelayMs = backoff,
  } = options;

  function headersFor(init: RequestInit) {
    const headers: Record<string, string> = { "X-Candidate-Id": candidateId };
    const token = session.token();
    if (token) headers.Authorization = "Bearer " + token;
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;
    if (init.sendAppVersion && appVersion) headers["X-App-Version"] = appVersion;
    return headers;
  }

  async function send<T>(method: Method, path: string, init: RequestInit): Promise<ApiResult<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? timeoutMs);
    let res: Response;
    try {
      res = await doFetch(buildUrl(baseUrl, path, init.query), {
        method,
        headers: headersFor(init),
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: controller.signal,
      });
    } catch (cause) {
      throw toApiError(null, null, cause);
    } finally {
      clearTimeout(timer);
    }
    clock.observe(res.headers.get("Date"));
    const body = await readBody(res);
    if (!res.ok) throw toApiError(res, body);
    return { data: body as T, replayed: res.headers.get("Idempotent-Replayed") === "true" };
  }

  async function request<T>(method: Method, path: string, init: RequestInit = {}) {
    const canRetry = method === "GET" || Boolean(init.idempotencyKey);
    if (!init.anonymous && !session.token()) await session.refresh();
    let relogged = false;
    // Once one answer is lost the server may have acted, so a later refusal is no proof it did not.
    let answerLost = false;
    for (let attempt = 0; ; attempt++) {
      const sentWith = session.token();
      try {
        return await send<T>(method, path, init);
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        if (error.outcome === "unknown") answerLost = true;
        // A token the server rejects, expired or no longer known, means sign in again once.
        const sessionGone = error.code === "session_expired" || error.code === "unauthorized";
        if (sessionGone && sentWith && !relogged) {
          relogged = true;
          // Another request may have signed in again while this one was in flight.
          if (session.token() === sentWith) await session.refresh();
          continue;
        }
        const retryable = canRetry && error.outcome !== "rejected" && error.retryable;
        if (!retryable || attempt + 1 >= (init.maxAttempts ?? maxAttempts)) {
          throw answerLost && init.idempotencyKey ? error.asUnknown() : error;
        }
        await sleep(retryDelayMs(attempt));
      }
    }
  }

  return { request };
}
