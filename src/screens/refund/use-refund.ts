import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

import { ApiError } from "@/api/errors";
import type { PaymentDetail } from "@/api/payments/interface";
import { formatCents, type MessageKey, parseEuroInput } from "@/core";
import { useT } from "@/hooks/use-t";
import { getPayment, refundPayment } from "@/api/payments";
import { refundIntents } from "@/lib/intents";
import { loadState } from "@/lib/load-state";
import { paymentDetailVersions } from "@/lib/versions";

import { type RefundIntent } from "./refund-intent";
import { isRefusal, parseRefundInput, refundMessageKey, validateRefund } from "./refund-errors";

const POLL_MS = 2000;

type Outcome = { tone: "pending" | "success" | "danger"; key: MessageKey; amountCents: number };

function outcomeFor(
  payment: PaymentDetail | undefined,
  intent: RefundIntent | undefined,
): Outcome | null {
  if (!intent) return null;
  const refund = payment?.refunds.find((r) => r.id === intent.refundId);
  if (refund?.status === "completed")
    return { tone: "success", key: "refund.completed", amountCents: refund.amountCents };
  if (refund?.status === "failed")
    return { tone: "danger", key: "refund.failed", amountCents: refund.amountCents };
  return { tone: "pending", key: "refund.inProgress", amountCents: intent.amountCents };
}

export function useRefund(paymentId: string) {
  const { t, locale } = useT();
  const queryClient = useQueryClient();

  const [intent, setIntent] = useState(() => refundIntents.get(paymentId));
  const [amountText, setAmountText] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<Outcome | null>(null);

  const query = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => paymentDetailVersions.keep(await getPayment(paymentId)),
    refetchInterval: intent ? POLL_MS : false,
  });
  const payment = query.data;
  const outcome = outcomeFor(payment, intent) ?? lastOutcome;
  const refundable = payment?.status === "confirmed" ? payment.refundableAmountCents : 0;

  const send = useCallback(
    async (current: RefundIntent) => {
      setSubmitting(true);
      try {
        const { data } = await refundPayment(
          current.paymentId,
          { amountCents: current.amountCents, reason: current.reason || undefined },
          current.key,
        );
        refundIntents.attachRefund(current.paymentId, data.id);
        setIntent(refundIntents.get(current.paymentId));
        void queryClient.invalidateQueries({ queryKey: ["payment", current.paymentId] });
        void queryClient.invalidateQueries({ queryKey: ["till-payments"] });
      } catch (e) {
        // Only a refusal ends the attempt; anything else is resent with the same key.
        if (e instanceof ApiError && isRefusal(e)) {
          refundIntents.clear(current.paymentId);
          setIntent(undefined);
          setError(refundMessageKey(e));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [queryClient],
  );

  const submit = useCallback(
    (amountCents: number | null) => {
      setError(null);
      const invalid = validateRefund(amountCents, refundable);
      if (invalid || amountCents === null) return setError(invalid);
      try {
        const next = refundIntents.start(paymentId, amountCents, reason.trim(), Crypto.randomUUID);
        setIntent(next);
        void send(next);
      } catch {
        setError("refundError.idempotency_mismatch");
      }
    },
    [paymentId, reason, refundable, send],
  );

  const refundAll = useCallback(() => submit(refundable), [refundable, submit]);
  const refundTyped = useCallback(() => {
    const parsed = parseRefundInput(amountText);
    if ("error" in parsed) return setError(parsed.error);
    submit(parsed.cents);
  }, [amountText, submit]);

  // A refund whose answer was lost is resent with its key; the server replays it.
  useEffect(() => {
    if (!intent || intent.refundId || submitting) return;
    const timer = setTimeout(() => void send(intent), POLL_MS);
    return () => clearTimeout(timer);
  }, [intent, submitting, send]);

  useEffect(() => {
    if (!intent || !outcome || outcome.tone === "pending") return;
    refundIntents.clear(paymentId);
    setIntent(undefined);
    setLastOutcome(outcome);
    setAmountText("");
    // The list shows what each payment has refunded, so it reloads once the refund settles.
    void queryClient.invalidateQueries({ queryKey: ["till-payments"] });
    AccessibilityInfo.announceForAccessibility(
      t(outcome.key, { amount: formatCents(outcome.amountCents, locale) }),
    );
  }, [intent, outcome, paymentId, queryClient, t, locale]);

  return {
    payment,
    loading: query.isPending,
    ...loadState(query),
    retry: query.refetch,
    refundable,
    busy: submitting || Boolean(intent),
    outcome,
    error,
    amountText,
    setAmountText,
    typedCents: parseEuroInput(amountText),
    hasAmount: amountText.trim().length > 0,
    reason,
    setReason,
    refundAll,
    refundTyped,
  };
}
