import { useLocalSearchParams } from "expo-router";

import { RefundScreen } from "@/screens/refund";

export default function RefundRoute() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  return <RefundScreen key={paymentId} paymentId={paymentId} />;
}
