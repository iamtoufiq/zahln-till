import apiInstance, { type ApiResult } from "@/api/api-instance";
import { ENDPOINTS } from "@/api/endpoints";

import type { PaymentDetail, PaymentFilters, PaymentPage, Refund, RefundInput } from "./interface";

/** This till's payments, newest first. */
export const listPayments = async (filters: PaymentFilters = {}): Promise<PaymentPage> =>
  (await apiInstance.request<PaymentPage>("GET", ENDPOINTS.PAYMENTS, { query: filters })).data;

export const getPayment = async (paymentId: string): Promise<PaymentDetail> =>
  (await apiInstance.request<PaymentDetail>("GET", ENDPOINTS.PAYMENT(paymentId))).data;

/**
 * Refunds all or part of a payment. Every retry must reuse `key`: the server
 * replays the first refund for a known key instead of paying out twice.
 */
export const refundPayment = (
  paymentId: string,
  body: RefundInput,
  key: string,
): Promise<ApiResult<Refund>> =>
  apiInstance.request<Refund>("POST", ENDPOINTS.PAYMENT_REFUNDS(paymentId), {
    body,
    idempotencyKey: key,
  });
