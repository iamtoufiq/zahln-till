import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { COLORS } from "./colors";
import { RADIUS, SPACE, TAP_MIN, TYPE } from "./tokens";

type Variant = "primary" | "secondary" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
};

const FILL: Record<Variant, string> = {
  primary: COLORS.primary,
  secondary: COLORS.primaryTint,
  danger: COLORS.danger,
};
const INK: Record<Variant, string> = {
  primary: COLORS.onPrimary,
  secondary: COLORS.primary,
  danger: COLORS.onPrimary,
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  accessibilityHint,
  testID,
}: Props) {
  const inactive = disabled || loading;
  const containerStyle = ({ pressed }: { pressed: boolean }): ViewStyle[] => [
    styles.container,
    { backgroundColor: FILL[variant], opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
  ];
  const labelStyle = [styles.label, { color: INK[variant] }];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator color={INK[variant]} />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: TAP_MIN,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { ...TYPE.button },
});
