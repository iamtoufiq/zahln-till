export type Outcome = "rejected" | "not_applied" | "unknown";

const UNKNOWN_STATUSES = new Set([408, 502, 504]);
const FALLBACK_CODES: Record<number, string> = {
  502: "connection_dropped",
  503: "unavailable",
  504: "timeout",
};

export class ApiError extends Error {
  constructor(
    readonly status: number | null,
    readonly code: string,
    readonly retryable: boolean,
    readonly outcome: Outcome,
    readonly detail: string | null = null,
  ) {
    super(`${status ?? "network"} ${code}`);
    this.name = "ApiError";
  }

  asUnknown(): ApiError {
    return new ApiError(this.status, this.code, this.retryable, "unknown", this.detail);
  }
}

function readProblem(body: unknown): { code?: string; retryable?: boolean; detail?: string } {
  return body !== null && typeof body === "object" ? body : {};
}

function outcomeFor(status: number, code: string): Outcome {
  // 503 fails before the server acts, except the deliberate payments switch.
  if (status === 503) return code === "payments_disabled" ? "rejected" : "not_applied";
  // Any other 5xx, or a 408 from a proxy, may have reached the server after it acted.
  if (UNKNOWN_STATUSES.has(status) || status >= 500) return "unknown";
  return "rejected";
}

export function toApiError(res: Response | null, body: unknown, cause?: unknown): ApiError {
  if (!res) {
    const code = cause instanceof Error && cause.name === "AbortError" ? "timeout" : "network";
    return new ApiError(null, code, true, "unknown");
  }
  const problem = readProblem(body);
  const code = problem.code ?? FALLBACK_CODES[res.status] ?? "http_" + res.status;
  const outcome = outcomeFor(res.status, code);
  const retryable = problem.retryable ?? outcome !== "rejected";
  return new ApiError(res.status, code, retryable, outcome, problem.detail ?? null);
}
