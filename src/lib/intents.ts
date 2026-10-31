import { createOrderIntentStore } from "@/screens/register/order-intent";
import { createRefundIntentStore } from "@/screens/refund/refund-intent";

import { kv } from "./storage";

export const orderIntents = createOrderIntentStore(kv);
export const refundIntents = createRefundIntentStore(kv);
