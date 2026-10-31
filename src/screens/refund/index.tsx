import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";

import type { Refund } from "@/api/payments/interface";
import { formatCents, formatDateTime, itemName } from "@/core";
import { useT } from "@/hooks/use-t";
import {
  Button,
  Card,
  COLORS,
  RADIUS,
  Screen,
  SPACE,
  StatusBadge,
  TAP_MIN,
  type Tone,
  TYPE,
} from "@/ui";

import { useRefund } from "./use-refund";

const REFUND_TONES: Record<Refund["status"], Tone> = {
  pending: "pending",
  completed: "success",
  failed: "danger",
};

export function RefundScreen({ paymentId }: { paymentId: string }) {
  const { t, locale } = useT();
  const r = useRefund(paymentId);
  const money = (cents: number) => formatCents(cents, locale);

  if (r.loading)
    return (
      <Screen>
        <ActivityIndicator color={COLORS.primary} />
      </Screen>
    );
  if (r.failed || !r.payment) {
    return (
      <Screen>
        <Text style={styles.body}>{t("error.generic")}</Text>
        <Button label={t("common.retry")} onPress={() => r.retry()} />
      </Screen>
    );
  }

  const p = r.payment;
  const canRefund = p.status === "confirmed" && r.refundable > 0;

  return (
    <Screen scroll>
      <View style={styles.columns}>
        <View style={styles.column}>
          <Card>
            <Text accessibilityRole="header" style={styles.title}>
              {t("refund.title")} · {p.orderId}
            </Text>
            <Text style={styles.muted}>
              {formatDateTime(p.createdAt, locale)} · {t(`group.${p.priceGroup}`)}
            </Text>
            {p.items.map((item) => (
              <Text key={item.itemId} style={styles.body}>
                {item.quantity} × {itemName(item.name, locale)}
              </Text>
            ))}
            <Row label={t("refund.paid")} value={money(p.amountCents)} />
            <Row label={t("refund.refunded")} value={money(p.refundedAmountCents)} />
            <Row label={t("refund.pending")} value={money(p.pendingRefundAmountCents)} />
            <Row label={t("refund.refundable")} value={money(r.refundable)} testID="refundable" />
          </Card>
          {p.refunds.length > 0 ? (
            <Card>
              <Text style={styles.section}>{t("refund.history")}</Text>
              {p.refunds.map((refund) => (
                <View key={refund.id} style={styles.row}>
                  <Text style={styles.body}>{money(refund.amountCents)}</Text>
                  <StatusBadge
                    tone={REFUND_TONES[refund.status]}
                    label={t(`refundStatus.${refund.status}`)}
                  />
                </View>
              ))}
            </Card>
          ) : null}
        </View>
        <View style={styles.column}>
          <Card>
            {r.reconnecting ? (
              <Text
                testID="refund-reconnecting"
                accessibilityLiveRegion="polite"
                style={styles.muted}
              >
                {t("common.reconnecting")}
              </Text>
            ) : null}
            {r.outcome ? (
              <Text testID="refund-outcome" accessibilityRole="alert" style={styles.outcome}>
                {t(r.outcome.key, { amount: money(r.outcome.amountCents) })}
              </Text>
            ) : null}
            {!canRefund ? (
              <Text style={styles.muted}>
                {p.status === "confirmed" ? t("refund.nothingLeft") : t("refund.notConfirmed")}
              </Text>
            ) : null}
            <Text style={styles.label}>{t("refund.amount")}</Text>
            <TextInput
              disableFullscreenUI
              testID="refund-amount"
              value={r.amountText}
              onChangeText={r.setAmountText}
              keyboardType="decimal-pad"
              editable={!r.busy}
              accessibilityLabel={t("refund.amount")}
              style={styles.input}
            />
            <Text style={styles.label}>{t("refund.reason")}</Text>
            <TextInput
              disableFullscreenUI
              testID="refund-reason"
              value={r.reason}
              onChangeText={r.setReason}
              maxLength={200}
              editable={!r.busy}
              accessibilityLabel={t("refund.reason")}
              style={styles.input}
            />
            {r.error ? (
              <Text testID="refund-error" accessibilityRole="alert" style={styles.error}>
                {t(r.error)}
              </Text>
            ) : null}
            <Button
              testID="refund-submit"
              label={
                r.typedCents
                  ? t("refund.submit", { amount: money(r.typedCents) })
                  : t("refund.title")
              }
              loading={r.busy}
              disabled={!canRefund || !r.hasAmount}
              onPress={r.refundTyped}
            />
            <Button
              testID="refund-all"
              label={t("refund.full", { amount: money(r.refundable) })}
              variant="secondary"
              disabled={!canRefund || r.busy}
              onPress={r.refundAll}
            />
          </Card>
        </View>
      </View>
    </Screen>
  );
}

function Row({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text testID={testID} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: "row", gap: SPACE.lg },
  column: { flex: 1, gap: SPACE.lg },
  title: { ...TYPE.title, color: COLORS.text },
  section: { ...TYPE.heading, color: COLORS.text },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  body: { ...TYPE.body, color: COLORS.text },
  muted: { ...TYPE.body, color: COLORS.muted },
  value: { ...TYPE.figure, color: COLORS.text },
  label: { ...TYPE.bodyStrong, color: COLORS.text },
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
  error: { ...TYPE.body, color: COLORS.danger },
  outcome: { ...TYPE.title, color: COLORS.text },
});
