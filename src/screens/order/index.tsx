import { memo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatCents, formatCountdown } from "@/core";
import { useT } from "@/hooks/use-t";
import { Button, COLORS, RADIUS, SPACE, TYPE } from "@/ui";

import { useOrderStatus } from "./use-order-status";

const QR_SIZE = 300;

export function OrderScreen({ orderId }: { orderId: string }) {
  const { t, locale } = useT();
  const { order, payment, view, seconds, newOrder, offline, declined } = useOrderStatus(orderId);
  const paidBody = payment
    ? t("order.paidBody", {
        amount: formatCents(payment.amountCents, locale),
        group: t(`group.${payment.priceGroup}`),
      })
    : "";

  if (view === "gone") {
    return (
      <SafeAreaView style={styles.center}>
        <Text testID="order-gone" accessibilityRole="header" style={styles.title}>
          {t("order.gone")}
        </Text>
        <Text style={styles.body}>{t("order.goneBody")}</Text>
        <Button testID="new-order" label={t("order.new")} onPress={newOrder} />
      </SafeAreaView>
    );
  }

  if (view === "loading" || !order) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (view === "paid") {
    return (
      <SafeAreaView style={styles.paid}>
        <Text style={styles.check} importantForAccessibility="no">
          ✓
        </Text>
        <Text testID="order-paid" accessibilityRole="header" style={styles.paidTitle}>
          {t("order.paid")}
        </Text>
        <Text testID="order-paid-amount" style={styles.paidBody}>
          {paidBody}
        </Text>
        <Button testID="new-order" label={t("order.new")} variant="secondary" onPress={newOrder} />
      </SafeAreaView>
    );
  }

  if (view === "expired") {
    return (
      <SafeAreaView style={styles.center}>
        <Text testID="order-expired" accessibilityRole="header" style={styles.title}>
          {t("order.expired")}
        </Text>
        <Text style={styles.body}>{t("order.expiredBody")}</Text>
        <Button testID="new-order" label={t("order.new")} onPress={newOrder} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.split}>
      <OrderQr
        id={order.id}
        payload={order.qrPayload}
        label={t("order.qrLabel", { id: order.id })}
      />
      <View style={styles.side}>
        <Text accessibilityRole="header" style={styles.title}>
          {view === "paying" ? t("order.paying") : t("order.scan")}
        </Text>
        <Text style={styles.body}>
          {view === "paying" ? t("order.payingBody") : t("order.scanHint")}
        </Text>
        {declined && view === "waiting" ? (
          <Text testID="order-declined" accessibilityLiveRegion="polite" style={styles.warning}>
            {t("order.declined")}
          </Text>
        ) : null}
        {offline ? (
          <Text testID="order-offline" accessibilityLiveRegion="polite" style={styles.warning}>
            {t("order.offline")}
          </Text>
        ) : null}
        {view === "waiting" ? (
          <Text testID="order-countdown" style={styles.countdown}>
            {t("order.expiresIn", { time: formatCountdown(seconds) })}
          </Text>
        ) : (
          <ActivityIndicator color={COLORS.primary} size="large" />
        )}
      </View>
    </SafeAreaView>
  );
}

// The countdown re-renders the screen every second; the QR only redraws when its order changes.
const OrderQr = memo(function OrderQr({
  id,
  payload,
  label,
}: {
  id: string;
  payload: string;
  label: string;
}) {
  return (
    <View testID="order-qr" style={styles.qrBox} accessible accessibilityLabel={label}>
      <QRCode value={payload} size={QR_SIZE} />
      <Text testID="order-id" style={styles.code} selectable>
        {id}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.lg,
    padding: SPACE.xxl,
    backgroundColor: COLORS.background,
  },
  split: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.background,
    padding: SPACE.xxl,
    gap: SPACE.xxl,
  },
  qrBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.md,
    padding: SPACE.xl,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  side: { flex: 1, justifyContent: "center", gap: SPACE.lg },
  title: { ...TYPE.hero, color: COLORS.text },
  body: { ...TYPE.body, color: COLORS.muted },
  countdown: { ...TYPE.title, color: COLORS.primary },
  warning: { ...TYPE.bodyStrong, color: COLORS.danger },
  code: { ...TYPE.caption, color: COLORS.muted },
  paid: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.lg,
    backgroundColor: COLORS.success,
  },
  check: { fontSize: 96, fontWeight: "800", color: COLORS.onPrimary },
  paidTitle: { ...TYPE.hero, fontSize: 44, lineHeight: 52, color: COLORS.onPrimary },
  paidBody: { ...TYPE.title, color: COLORS.onPrimary },
});
