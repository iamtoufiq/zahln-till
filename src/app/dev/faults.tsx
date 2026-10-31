import { Redirect, useLocalSearchParams } from "expo-router";

import { FAULT_MODES, type FaultMode } from "@/api/faults";
import { setFaultMode } from "@/api/api-instance";

// Dev builds only: lets E2E flows switch network faults with a deep link.
export default function DevFaultsLink() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  if (__DEV__ && FAULT_MODES.includes(mode as FaultMode)) setFaultMode(mode as FaultMode);
  return <Redirect href="/" />;
}
