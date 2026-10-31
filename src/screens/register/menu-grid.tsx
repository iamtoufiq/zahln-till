import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MenuItem } from "@/api/orders/interface";
import { formatCents, itemName } from "@/core";
import { useT } from "@/hooks/use-t";
import { COLORS, RADIUS, SPACE, TYPE } from "@/ui";

type Props = { menu: MenuItem[]; onAdd: (itemId: string) => void };

export const MenuGrid = memo(function MenuGrid({ menu, onAdd }: Props) {
  const { t, locale } = useT();

  return (
    <View style={styles.grid}>
      {menu.map((item) => {
        const name = itemName(item.name, locale);
        return (
          <Pressable
            key={item.id}
            testID={`menu-${item.id}`}
            style={styles.tile}
            accessibilityRole="button"
            accessibilityLabel={t("register.add", { item: name })}
            onPress={() => onAdd(item.id)}
          >
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.prices}>
              {formatCents(item.prices.student, locale)} · {formatCents(item.prices.staff, locale)}{" "}
              · {formatCents(item.prices.guest, locale)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SPACE.md,
  },
  tile: {
    width: "48.5%",
    minHeight: 110,
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "space-between",
  },
  name: { ...TYPE.title, color: COLORS.text },
  prices: { ...TYPE.caption, color: COLORS.muted },
});
