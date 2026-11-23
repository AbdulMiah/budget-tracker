import { format } from "date-fns";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MoneyInput } from "@/components/MoneyInput";
import { SectionTitle } from "@/components/SectionTitle";
import { useBankData } from "@/hooks/useBankData";
import { useMoney } from "@/hooks/useMoney";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import { useZakat } from "@/hooks/useZakat";
import { Stat } from "@/screens/zakat/components/Stat";
import { ZakatPaymentRow } from "@/screens/zakat/components/ZakatPaymentRow";
import { withEntry } from "@/utils/helpers";
import { formatHijri, toHijri } from "@/utils/hijri";

export function ZakatYearScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const { year: key } = useLocalSearchParams<{ year: string }>();
  const { accounts } = useBankData();
  const { settings, update } = useSettings();
  const { zakatWealthOverrides } = settings;
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
  const cardColors = { backgroundColor: t.card, borderColor: t.border };
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
        <View style={[styles.card, cardColors]}>
          <Text style={[styles.dates, { color: t.muted }]}>
            {formatHijri(toHijri(year.start))} – {formatHijri(year.dueHijri)}
          </Text>
          <Text style={[styles.dates, styles.gregorian, { color: t.muted }]}>
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
        <View style={[styles.card, cardColors]}>
          <View style={styles.wealthRow}>
            <Text style={[styles.label, { color: t.text }]}>Net worth</Text>
            <Text style={[styles.wealth, { color: t.text }]}>
              {formatMoney(year.wealth)}
            </Text>
          </View>
          {year.wealthSource === "history" && year.beforeHistory && (
            <Text style={[styles.warning, { color: t.committed }]}>
              Your transactions don&apos;t go back this far, so this is only an
              estimate. Enter your real figure below.
            </Text>
          )}
          {year.complete && (
            <View style={[styles.override, { borderTopColor: t.border }]}>
              <Text style={[styles.label, { color: t.text }]}>
                Your own figure
              </Text>
              <View style={styles.input}>
                <MoneyInput
                  value={zakatWealthOverrides[year.key] ?? null}
                  onChange={(pence) =>
                    update((s) => ({
                      zakatWealthOverrides: withEntry(
                        s.zakatWealthOverrides,
                        year.key,
                        pence
                      ) as Record<string, number>,
                    }))
                  }
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
        <View style={[styles.card, styles.list, cardColors]}>
          {year.allocations.length === 0 ? (
            <Text style={[styles.noPayments, { color: t.muted }]}>
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: "center", padding: 32, fontSize: 15 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  dates: { fontSize: 13 },
  gregorian: { marginTop: 2 },
  big: { fontSize: 28, fontWeight: "800", marginTop: 12, marginBottom: 14 },
  summary: { flexDirection: "row", justifyContent: "space-between" },
  wealthRow: { flexDirection: "row", alignItems: "center" },
  label: { flex: 1, fontSize: 15 },
  wealth: { fontSize: 17, fontWeight: "700" },
  warning: { fontSize: 13, marginTop: 4 },
  input: { width: 130 },
  override: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  list: { padding: 0, overflow: "hidden" },
  noPayments: { fontSize: 14, textAlign: "center", padding: 16 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
});
