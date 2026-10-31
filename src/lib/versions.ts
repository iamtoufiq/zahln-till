import type { Payment, PaymentDetail } from "@/api/payments/interface";
import { createVersionCache } from "@/core";

export const paymentVersions = createVersionCache<Payment>();
export const paymentDetailVersions = createVersionCache<PaymentDetail>();
