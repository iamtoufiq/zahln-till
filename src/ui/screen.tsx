import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "./colors";
import { SPACE } from "./tokens";

export function Screen({ children, scroll = false }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  fill: { flex: 1, padding: SPACE.lg, gap: SPACE.lg },
  content: { padding: SPACE.lg, gap: SPACE.lg },
});
