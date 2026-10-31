import { StyleSheet, Text, View } from "react-native";

import { useT } from "@/hooks/use-t";
import { Button, COLORS, Screen, SPACE, TYPE } from "@/ui";

import { CASHIERS, usePickCashier } from "./use-pick-cashier";

export function PickCashierScreen() {
  const { t } = useT();
  const { pending, failed, pick } = usePickCashier();

  return (
    <Screen scroll>
      <Text accessibilityRole="header" style={styles.title}>
        {t("pickCashier.title")}
      </Text>
      <Text style={styles.subtitle}>{t("pickCashier.subtitle")}</Text>
      <View style={styles.grid}>
        {CASHIERS.map((cashier) => (
          <View key={cashier.username} style={styles.cell}>
            <Button
              testID={`pick-${cashier.username}`}
              label={cashier.label}
              variant="secondary"
              loading={pending === cashier.username}
              disabled={pending !== null}
              onPress={() => pick(cashier.username)}
            />
          </View>
        ))}
      </View>
      {failed ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t("error.generic")}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...TYPE.hero, color: COLORS.primaryDark },
  subtitle: { ...TYPE.body, color: COLORS.muted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.md },
  cell: { flexBasis: "48%", flexGrow: 1 },
  error: { ...TYPE.body, color: COLORS.danger },
});
