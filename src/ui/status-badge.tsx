import { StyleSheet, Text, View } from "react-native";

import { COLORS } from "./colors";
import { RADIUS, SPACE, TYPE } from "./tokens";

export type Tone = "success" | "pending" | "danger" | "neutral";

const TONES: Record<Tone, { fill: string; ink: string }> = {
  success: { fill: COLORS.successTint, ink: COLORS.success },
  pending: { fill: COLORS.warningTint, ink: COLORS.text },
  danger: { fill: COLORS.dangerTint, ink: COLORS.danger },
  neutral: { fill: COLORS.background, ink: COLORS.muted },
};

export function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  const badgeStyle = [styles.badge, { backgroundColor: TONES[tone].fill }];
  const labelStyle = [styles.label, { color: TONES[tone].ink }];
  return (
    <View style={badgeStyle}>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs / 2,
  },
  label: TYPE.captionStrong,
});
