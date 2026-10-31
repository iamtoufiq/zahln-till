import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { FAULT_MODES } from "@/api/faults";
import { getFaultMode, setFaultMode } from "@/api/api-instance";
import { Button, COLORS, Screen, TYPE } from "@/ui";

// Dev builds only: reached by long-pressing the greeting on Home.
export function DevFaultsScreen() {
  const [mode, setMode] = useState(getFaultMode());

  return (
    <Screen scroll>
      <Text style={styles.title}>Network faults: {mode}</Text>
      {FAULT_MODES.map((m) => (
        <Button
          key={m}
          testID={`fault-${m}`}
          label={m}
          variant={m === mode ? "primary" : "secondary"}
          onPress={() => {
            setFaultMode(m);
            setMode(m);
          }}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...TYPE.title, color: COLORS.text },
});
