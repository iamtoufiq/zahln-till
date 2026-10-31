import { Stack, useLocalSearchParams } from "expo-router";

import { OrderScreen } from "@/screens/order";

// The API cannot cancel an order, so an open QR must not be left with a swipe (iOS);
// Android's back button is blocked in the screen itself.
export default function OrderRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <OrderScreen key={orderId} orderId={orderId} />
    </>
  );
}
