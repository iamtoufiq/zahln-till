import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MenuItem, Prices } from "@/api/orders/interface";
import { formatCents, itemName } from "@/core";
import { useT } from "@/hooks/use-t";
import { Button, Card, COLORS, SPACE, TAP_MIN, TYPE } from "@/ui";

import type { Cart } from "./cart";
import type { ChargeFailure } from "./charge-failure";

const GROUPS = ["student", "staff", "guest"] as const;

type Props = {
  cart: Cart;
  menu: MenuItem[];
  totals: Prices;
  isEmpty: boolean;
  creating: boolean;
  failure: ChargeFailure | null;
  onRemove: (itemId: string) => void;
  onCharge: () => void;
};

export function CartPanel({
  cart,
  menu,
  totals,
  isEmpty,
  creating,
  failure,
  onRemove,
  onCharge,
}: Props) {
  const { t, locale } = useT();
  const names = new Map(menu.map((item) => [item.id, itemName(item.name, locale)]));

  return (
    <Card>
      <Text accessibilityRole="header" style={styles.heading}>
        {t("register.cart")}
      </Text>
      {isEmpty ? <Text style={styles.muted}>{t("register.empty")}</Text> : null}
      {Object.entries(cart).map(([itemId, quantity]) => {
        const name = names.get(itemId) ?? itemId;
        return (
          <Pressable
            key={itemId}
            testID={`cart-${itemId}`}
            style={styles.line}
            accessibilityRole="button"
            accessibilityLabel={t("register.remove", { item: name })}
            onPress={() => onRemove(itemId)}
          >
            <Text style={styles.body}>
              {t("register.quantity", { count: quantity, item: name })}
            </Text>
            <Text style={styles.remove}>−</Text>
          </Pressable>
        );
      })}
      <Text style={styles.muted}>{t("register.totals")}</Text>
      {GROUPS.map((group) => (
        <View key={group} style={styles.total}>
          <Text style={styles.body}>{t(`group.${group}`)}</Text>
          <Text style={styles.amount}>{formatCents(totals[group], locale)}</Text>
        </View>
      ))}
      {failure ? (
        <Text testID="charge-error" accessibilityLiveRegion="assertive" style={styles.error}>
          {failure === "refused" ? t("order.createFailed") : t("order.createUnknown")}
        </Text>
      ) : null}
      <Button
        testID="charge"
        label={creating ? t("order.creating") : t("register.charge")}
        accessibilityHint={t("register.chargeHint")}
        loading={creating}
        disabled={isEmpty}
        onPress={onCharge}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { ...TYPE.title, color: COLORS.text },
  line: {
    minHeight: TAP_MIN,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  body: { ...TYPE.body, color: COLORS.text },
  remove: { ...TYPE.hero, color: COLORS.danger, paddingHorizontal: SPACE.md },
  muted: { ...TYPE.body, color: COLORS.muted },
  total: { flexDirection: "row", justifyContent: "space-between" },
  amount: { ...TYPE.figure, color: COLORS.text },
  error: { ...TYPE.body, color: COLORS.danger },
});
