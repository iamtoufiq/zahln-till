import type { Schemas } from "@/api/interface";

export type Payment = Schemas["Payment"];
export type PaymentDetail = Schemas["PaymentDetail"];
export type PaymentEvent = Schemas["PaymentEvent"];
export type PaymentPage = Schemas["PaymentPage"];
export type Refund = Schemas["Refund"];

export type PaymentFilters = {
  q?: string;
  limit?: number;
  cursor?: string;
};

export type RefundInput = { amountCents: number; reason?: string };
