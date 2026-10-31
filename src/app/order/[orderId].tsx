import { useLocalSearchParams } from "expo-router";

import { OrderScreen } from "@/screens/order";

export default function OrderRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <OrderScreen key={orderId} orderId={orderId} />;
}
