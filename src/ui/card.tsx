import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { COLORS } from "./colors";
import { RADIUS, SPACE } from "./tokens";

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACE.lg,
    gap: SPACE.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
});
