import { Redirect } from "expo-router";

import { orderIntents } from "@/lib/intents";
import { PickCashierScreen } from "@/screens/pick-cashier";
import { useSessionStore } from "@/stores/session-store";

export default function Index() {
  const user = useSessionStore((s) => s.user);

  if (!user) return <PickCashierScreen />;
  // A shown QR survives a till restart, for the cashier who rang it up.
  const openOrderId = orderIntents.openOrderFor(user.id);
  return <Redirect href={openOrderId ? `/order/${openOrderId}` : "/register"} />;
}
