import { format } from "date-fns";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MoneyInput } from "@/components/MoneyInput";
import { SectionTitle } from "@/components/SectionTitle";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { useZakat } from "@/hooks/useZakat";
import { ZakatPaymentRow } from "@/screens/zakat/components/ZakatPaymentRow";
import { useStore } from "@/store/useStore";
import { formatHijri, toHijri } from "@/utils/hijri";

export function ZakatYearScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const { year: key } = useLocalSearchParams<{ year: string }>();
  const { accounts, zakatWealthOverrides, setZakatWealthOverride } = useStore();
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const { years } = useZakat();
  const year = years.find((y) => y.key === key);

  if (!year) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: t.bg }]}
        edges={["bottom"]}
      >
        <Stack.Screen options={{ title: "Zakat year" }} />
        <Text style={[styles.empty, { color: t.muted }]}>
          This zakat year is no longer in your history.
        </Text>
      </SafeAreaView>
    );
  }

  const settled = year.remaining <= 0;
  const wealthNote =
    year.wealthSource === "manual"
      ? "Using the figure you entered."
      : year.wealthSource === "current"
        ? "Your net worth today. It is fixed on the due date."
        : "Net worth on the due date, rebuilt from your transactions.";
  const wealthInfo = [
    wealthNote,
    year.aboveNisab
      ? "Zakat is 2.5% of it."
      : "It is below nisab, so no zakat was due.",
    year.complete
      ? "Enter your own figure to include savings outside your linked accounts."
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["bottom"]}
    >
      <Stack.Screen options={{ title: `${year.key} AH` }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View
          style={[
            styles.card,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <Text style={{ color: t.muted, fontSize: 13 }}>
            {formatHijri(toHijri(year.start))} – {formatHijri(year.dueHijri)}
          </Text>
          <Text style={{ color: t.muted, fontSize: 13, marginTop: 2 }}>
            {format(year.start, "d MMM yyyy")} –{" "}
            {format(year.due, "d MMM yyyy")}
          </Text>
          <Text
            style={[
              styles.big,
              { color: year.zakat > 0 && !settled ? t.spend : t.text },
            ]}
          >
            {year.zakat === 0
              ? "Not due"
              : settled
                ? "Paid"
                : `${formatMoney(year.remaining)} left`}
          </Text>
          <View style={styles.summary}>
            <Stat label="Zakat" value={formatMoney(year.zakat)} />
            <Stat label="Paid" value={formatMoney(year.paid)} />
            <Stat
              label="Remaining"
              value={formatMoney(Math.max(0, year.remaining))}
            />
          </View>
        </View>

        <SectionTitle title="Wealth" info={wealthInfo} marginTop={4} />
        <View
          style={[
            styles.card,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <View style={styles.wealthRow}>
            <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>
              Net worth
            </Text>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: "700" }}>
              {formatMoney(year.wealth)}
            </Text>
          </View>
          {year.wealthSource === "history" && year.beforeHistory && (
            <Text style={{ color: t.committed, fontSize: 13, marginTop: 4 }}>
              Your transactions don&apos;t go back this far, so this is only an
              estimate. Enter your real figure below.
            </Text>
          )}
          {year.complete && (
            <View style={[styles.override, { borderTopColor: t.border }]}>
              <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>
                Your own figure
              </Text>
              <View style={{ width: 130 }}>
                <MoneyInput
                  value={zakatWealthOverrides[year.key] ?? null}
                  onChange={(pence) => setZakatWealthOverride(year.key, pence)}
                  placeholder="—"
                  accessibilityLabel="Your own net worth figure"
                />
              </View>
            </View>
          )}
        </View>

        <SectionTitle
          title="Payments counted"
          info="Payments go to the oldest year with zakat left to pay, so one payment can be split across years."
          marginTop={4}
        />
        <View
          style={[
            styles.card,
            styles.list,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          {year.allocations.length === 0 ? (
            <Text
              style={{
                color: t.muted,
                fontSize: 14,
                textAlign: "center",
                padding: 16,
              }}
            >
              No payments counted yet.
            </Text>
          ) : (
            year.allocations.map(({ payment, amount }, i) => (
              <View key={payment.id}>
                {i > 0 && (
                  <View
                    style={[styles.divider, { backgroundColor: t.border }]}
                  />
                )}
                <ZakatPaymentRow
                  payment={payment}
                  amount={amount}
                  account={
                    payment.accountId
                      ? accountById.get(payment.accountId)
                      : undefined
                  }
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View
      style={styles.stat}
      accessible
      accessibilityLabel={`${label} ${value}`}
    >
      <Text style={{ color: t.muted, fontSize: 13 }}>{label}</Text>
      <Text
        style={{ color: t.text, fontSize: 16, fontWeight: "700", marginTop: 2 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: "center", padding: 32, fontSize: 15 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  big: { fontSize: 28, fontWeight: "800", marginTop: 12, marginBottom: 14 },
  summary: { flexDirection: "row", justifyContent: "space-between" },
  stat: { flex: 1 },
  wealthRow: { flexDirection: "row", alignItems: "center" },
  override: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  list: { padding: 0, overflow: "hidden" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
});
