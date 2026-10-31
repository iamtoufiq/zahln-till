import apiInstance, { type ApiResult } from "@/api/api-instance";
import type { RequestInit } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";

import type { Order, OrderLineInput } from "./interface";

/**
 * Opens an order on this till. Every retry must reuse `key`: the server
 * replays the first order for a known key instead of opening a second one.
 */
export const createOrder = (items: OrderLineInput[], key: string): Promise<ApiResult<Order>> =>
  apiInstance.request<Order>("POST", ENDPOINTS.ORDERS, { body: { items }, idempotencyKey: key });

export const getOrder = async (
  orderId: string,
  retry?: Pick<RequestInit, "maxAttempts" | "timeoutMs">,
): Promise<Order> =>
  (await apiInstance.request<Order>("GET", ENDPOINTS.ORDER(orderId), retry)).data;
