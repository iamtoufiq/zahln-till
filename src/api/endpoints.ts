// Paths are relative to API_CONFIG.BASE_URL (EXPO_PUBLIC_API_BASE_URL).
export const ENDPOINTS = {
  // Auth
  SESSIONS: "/sessions",

  // Mensas
  MENSAS: "/mensas",

  // Orders
  ORDERS: "/orders",
  ORDER: (orderId: string) => `/orders/${encodeURIComponent(orderId)}`,

  // Payments
  PAYMENTS: "/payments",
  PAYMENT: (paymentId: string) => `/payments/${encodeURIComponent(paymentId)}`,
  PAYMENT_REFUNDS: (paymentId: string) => `/payments/${encodeURIComponent(paymentId)}/refunds`,
};
