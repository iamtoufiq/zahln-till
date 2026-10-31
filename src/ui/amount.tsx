import { StyleSheet, Text } from "react-native";

import { formatCents, type Locale } from "@/core";

import { COLORS } from "./colors";
import { TYPE } from "./tokens";

type Props = { cents: number; locale: Locale; size?: "md" | "xl"; testID?: string };

export function Amount({ cents, locale, size = "md", testID }: Props) {
  const text = formatCents(cents, locale);
  return (
    <Text testID={testID} accessibilityLabel={text} style={size === "xl" ? styles.xl : styles.md}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  md: { ...TYPE.figure, color: COLORS.text },
  xl: { ...TYPE.amount, color: COLORS.text },
});
