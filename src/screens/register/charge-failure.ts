import { ApiError } from "@/api/errors";

export type ChargeFailure = "refused" | "unknown";

// Only a refusal proves no order exists; anything else keeps the key so Charge returns the same order.
export function chargeFailure(error: unknown): ChargeFailure {
  return error instanceof ApiError && error.outcome === "rejected" ? "refused" : "unknown";
}
