import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT } from "@/hooks/use-t";
import { Button, COLORS, SPACE, TYPE } from "@/ui";

import { CartPanel } from "./cart-panel";
import { MenuGrid } from "./menu-grid";
import { useRegister } from "./use-register";

export function RegisterScreen() {
  const { t } = useT();
  const r = useRegister();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onLongPress={r.openDevFaults} accessible={false} style={styles.titleBox}>
          <Text accessibilityRole="header" style={styles.title}>
            {t("register.title", { mensa: r.mensaName, till: r.tillName })}
          </Text>
        </Pressable>
        <Button
          testID="payments"
          label={t("register.payments")}
          variant="secondary"
          onPress={r.openPayments}
        />
        <Button
          testID="language"
          label={t("common.language")}
          variant="secondary"
          onPress={r.toggleLocale}
        />
        <Button
          testID="switch-cashier"
          label={t("common.signOut")}
          variant="secondary"
          onPress={r.switchCashier}
        />
      </View>
      <View style={styles.body}>
        <ScrollView style={styles.menu} contentContainerStyle={styles.menuContent}>
          {r.menuLoading ? <ActivityIndicator color={COLORS.primary} /> : null}
          {r.menuFailed ? <Button label={t("common.retry")} onPress={() => r.retryMenu()} /> : null}
          <MenuGrid menu={r.menu} onAdd={r.add} />
        </ScrollView>
        <ScrollView style={styles.cart} contentContainerStyle={styles.menuContent}>
          <CartPanel
            cart={r.cart}
            menu={r.menu}
            totals={r.totals}
            isEmpty={r.isEmpty}
            creating={r.charge === "creating"}
            failure={r.charge === "refused" || r.charge === "unknown" ? r.charge : null}
            onRemove={r.remove}
            onCharge={r.chargeOrder}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    padding: SPACE.lg,
    backgroundColor: COLORS.primary,
  },
  titleBox: { flex: 1 },
  title: { ...TYPE.title, color: COLORS.onPrimary },
  body: { flex: 1, flexDirection: "row" },
  menu: { flex: 3 },
  cart: { flex: 2 },
  menuContent: { padding: SPACE.lg, gap: SPACE.lg },
});
