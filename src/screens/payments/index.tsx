import { useRouter } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { Payment } from "@/api/payments/interface";
import { formatCents, formatDateTime } from "@/core";
import { useT } from "@/hooks/use-t";
import { Button, COLORS, RADIUS, Screen, SPACE, StatusBadge, TAP_MIN, type Tone, TYPE } from "@/ui";

import { refundNote } from "./refund-note";
import { useTillPayments } from "./use-till-payments";

const TONES: Record<Payment["status"], Tone> = {
  pending: "pending",
  confirmed: "success",
  declined: "danger",
};

export function PaymentsScreen() {
  const { t, locale } = useT();
  const router = useRouter();
  const p = useTillPayments();

  const renderItem = useCallback(
    ({ item }: { item: Payment }) => {
      const note = refundNote(item);
      return (
        <Pressable
          testID={`payment-${item.orderId}`}
          style={styles.row}
          accessibilityRole="button"
          onPress={() => router.push(`/refund/${item.id}`)}
        >
          <View style={styles.main}>
            <Text style={styles.body}>{formatDateTime(item.createdAt, locale)}</Text>
            <Text style={styles.muted}>
              {item.orderId} · {t(`group.${item.priceGroup}`)}
            </Text>
          </View>
          <View style={styles.money}>
            <Text style={styles.amount}>{formatCents(item.amountCents, locale)}</Text>
            {note ? (
              <Text testID={`refund-note-${item.orderId}`} style={styles.muted}>
                {t(note.key, { amount: formatCents(note.cents, locale) })}
              </Text>
            ) : null}
          </View>
          <StatusBadge tone={TONES[item.status]} label={t(`status.${item.status}`)} />
        </Pressable>
      );
    },
    [locale, router, t],
  );

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>
        {t("payments.title")}
      </Text>
      <TextInput
        disableFullscreenUI
        testID="payments-search"
        value={p.query}
        onChangeText={p.setQuery}
        onSubmitEditing={p.submitSearch}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={t("payments.search")}
        placeholderTextColor={COLORS.muted}
        accessibilityLabel={t("payments.search")}
        style={styles.input}
      />
      {p.failed ? <Button label={t("common.retry")} onPress={() => p.refresh()} /> : null}
      <FlatList
        data={p.payments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={p.refreshing}
        onRefresh={p.refresh}
        ListEmptyComponent={
          // A list that failed to load is not an empty list.
          p.loading || p.failed ? undefined : (
            <Text style={styles.muted}>{t("payments.empty")}</Text>
          )
        }
        ListFooterComponent={
          p.hasMore ? (
            <Button
              label={t("payments.loadMore")}
              variant="secondary"
              loading={p.loadingMore}
              onPress={() => p.loadMore()}
            />
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...TYPE.hero, color: COLORS.primaryDark },
  input: {
    ...TYPE.body,
    minHeight: TAP_MIN,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACE.lg,
    color: COLORS.text,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.lg,
    paddingHorizontal: SPACE.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  main: { flex: 1 },
  body: { ...TYPE.body, color: COLORS.text },
  muted: { ...TYPE.caption, color: COLORS.muted },
  money: { alignItems: "flex-end" },
  amount: { ...TYPE.figure, color: COLORS.text },
});
