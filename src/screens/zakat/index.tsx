import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format, startOfDay } from "date-fns";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DonutRing } from "@/components/DonutRing";
import { EyeButton } from "@/components/EyeButton";
import { InfoTip } from "@/components/InfoTip";
import { useTheme } from "@/constants/theme";
import { useMoney } from "@/hooks/useMoney";
import { useZakat } from "@/hooks/useZakat";
import { AddZakatPaymentSheet } from "@/screens/zakat/components/AddZakatPaymentSheet";
import { NisabCard } from "@/screens/zakat/components/NisabCard";
import { ZakatPaymentRow } from "@/screens/zakat/components/ZakatPaymentRow";
import { useStore } from "@/store/useStore";
import { formatHijri, toHijri } from "@/utils/hijri";
import { ZakatYear } from "@/utils/zakat";

export function ZakatScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const accounts = useStore((s) => s.accounts);
  const setZakatStart = useStore((s) => s.setZakatStart);
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const zakat = useZakat();
  const { current } = zakat;
  const [adding, setAdding] = useState(false);
  const previous = zakat.years.filter((y) => y.complete).reverse();
  const openYear = (y: ZakatYear) =>
    router.push({ pathname: "/zakat/[year]", params: { year: y.key } });

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.h1, { color: t.text }]}>Zakat</Text>
          <EyeButton />
        </View>

        {!current ? (
          <>
            <NisabCard
              netWorth={zakat.netWorth}
              nisab={zakat.nisab}
              aboveNisab={zakat.aboveNisab}
            />
            <View
              style={[
                styles.card,
                styles.empty,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <MaterialCommunityIcons
                name="hand-coin-outline"
                size={40}
                color={t.muted}
              />
              <Text style={[styles.emptyTitle, { color: t.text }]}>
                Start tracking zakat
              </Text>
              {zakat.nisab.threshold !== null && zakat.aboveNisab ? (
                <>
                  <Text
                    style={{
                      color: t.muted,
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    Zakat is 2.5% of your wealth, due each lunar year from the
                    day it first reached nisab. On today&apos;s net worth that
                    would be {formatMoney(zakat.zakatToday)}.
                  </Text>
                  <Pressable
                    onPress={() =>
                      setZakatStart(
                        format(startOfDay(new Date()), "yyyy-MM-dd")
                      )
                    }
                    accessibilityRole="button"
                    style={[styles.button, { backgroundColor: t.primary }]}
                  >
                    <Text style={styles.buttonText}>Start from today</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push("/zakat-settings")}
                    hitSlop={10}
                    accessibilityRole="button"
                  >
                    <Text
                      style={{
                        color: t.primary,
                        fontSize: 15,
                        fontWeight: "600",
                        marginTop: 4,
                      }}
                    >
                      I already have a zakat date
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text
                  style={{ color: t.muted, fontSize: 14, textAlign: "center" }}
                >
                  {zakat.nisab.threshold === null
                    ? "Add gold and silver prices first, so the app can check your wealth against nisab."
                    : "Tracking starts once your wealth reaches nisab."}
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            {zakat.overdue.map((y) => (
              <Pressable
                key={y.key}
                onPress={() => openYear(y)}
                accessibilityRole="button"
                style={[
                  styles.card,
                  styles.overdue,
                  {
                    backgroundColor: t.spend + "14",
                    borderColor: t.spend + "55",
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={22} color={t.spend} />
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text
                    style={{ color: t.text, fontSize: 15, fontWeight: "700" }}
                  >
                    Zakat for {y.key} AH is due
                  </Text>
                  <Text style={{ color: t.muted, fontSize: 13, marginTop: 2 }}>
                    {formatMoney(y.remaining)} left to pay · due since{" "}
                    {format(y.due, "d MMM yyyy")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={t.muted} />
              </Pressable>
            ))}

            <View
              style={[
                styles.card,
                styles.countdown,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <View
                style={[
                  styles.countdownIcon,
                  { backgroundColor: t.primary + "1f" },
                ]}
              >
                <Ionicons name="moon-outline" size={22} color={t.primary} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text
                  style={{ color: t.text, fontSize: 16, fontWeight: "700" }}
                >
                  Due {formatHijri(current.dueHijri)}
                </Text>
                <Text style={{ color: t.muted, fontSize: 13, marginTop: 2 }}>
                  {format(current.due, "EEEE d MMMM yyyy")}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.days, { color: t.text }]}>
                  {zakat.daysLeft}
                </Text>
                <Text style={{ color: t.muted, fontSize: 12 }}>
                  {zakat.daysLeft === 1 ? "day left" : "days left"}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.tipRow}>
                    <Text
                      style={{ color: t.text, fontSize: 16, fontWeight: "700" }}
                    >
                      Zakat year {current.key} AH
                    </Text>
                    <InfoTip
                      label="Zakat this year"
                      text={`${
                        current.aboveNisab
                          ? `2.5% of your ${formatMoney(current.wealth)} net worth. It follows your balances until the due date, when it's fixed.`
                          : `Your ${formatMoney(current.wealth)} net worth is below nisab, so no zakat is due on it right now.`
                      } Today is ${formatHijri(toHijri(new Date()))}.`}
                    />
                  </View>
                  <Text style={{ color: t.muted, fontSize: 13, marginTop: 2 }}>
                    {format(current.start, "d MMM yyyy")} –{" "}
                    {format(current.due, "d MMM yyyy")}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push("/zakat-settings")}
                  hitSlop={10}
                  accessibilityRole="button"
                >
                  <Text
                    style={{
                      color: t.primary,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    Edit
                  </Text>
                </Pressable>
              </View>
              <View style={styles.ring}>
                <DonutRing
                  segments={[
                    {
                      key: "paid",
                      value: Math.max(0, current.paid),
                      color: t.income,
                    },
                  ]}
                  total={Math.max(current.zakat, current.paid, 1)}
                  size={200}
                  stroke={22}
                >
                  <Text style={{ color: t.muted, fontSize: 13 }}>
                    {current.remaining < 0 ? "Paid ahead" : "Left to pay"}
                  </Text>
                  <Text
                    style={[styles.left, { color: t.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatMoney(Math.abs(current.remaining))}
                  </Text>
                  <Text style={{ color: t.muted, fontSize: 12 }}>
                    of {formatMoney(current.zakat)}
                  </Text>
                </DonutRing>
              </View>
              <View style={styles.legend}>
                <Key label="Zakat" value={formatMoney(current.zakat)} />
                <Key
                  color={t.income}
                  label="Paid"
                  value={formatMoney(current.paid)}
                />
                <Key
                  color={t.border}
                  label="Remaining"
                  value={formatMoney(Math.max(0, current.remaining))}
                />
              </View>
            </View>

            <NisabCard
              netWorth={zakat.netWorth}
              nisab={zakat.nisab}
              aboveNisab={zakat.aboveNisab}
            />

            <View style={styles.sectionRow}>
              <Text
                style={[
                  styles.section,
                  styles.sectionInRow,
                  { color: t.muted },
                ]}
              >
                PAYMENTS
              </Text>
              <Pressable
                onPress={() => setAdding(true)}
                hitSlop={10}
                accessibilityRole="button"
                style={styles.add}
              >
                <Ionicons name="add-circle" size={18} color={t.primary} />
                <Text
                  style={{
                    color: t.primary,
                    fontSize: 14,
                    fontWeight: "600",
                    marginLeft: 4,
                  }}
                >
                  Add payment
                </Text>
              </Pressable>
            </View>
            <View
              style={[
                styles.card,
                styles.list,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              {zakat.payments.length === 0 ? (
                <Text
                  style={{
                    color: t.muted,
                    fontSize: 14,
                    textAlign: "center",
                    padding: 16,
                  }}
                >
                  No payments yet. Add one here, or label a bank transaction as
                  Zakat.
                </Text>
              ) : (
                zakat.payments.map((p, i) => (
                  <View key={p.id}>
                    {i > 0 && (
                      <View
                        style={[styles.divider, { backgroundColor: t.border }]}
                      />
                    )}
                    <ZakatPaymentRow
                      payment={p}
                      account={
                        p.accountId ? accountById.get(p.accountId) : undefined
                      }
                    />
                  </View>
                ))
              )}
            </View>

            {previous.length > 0 && (
              <>
                <Text style={[styles.section, { color: t.muted }]}>
                  PREVIOUS YEARS
                </Text>
                <View
                  style={[
                    styles.card,
                    styles.list,
                    { backgroundColor: t.card, borderColor: t.border },
                  ]}
                >
                  {previous.map((y, i) => (
                    <View key={y.key}>
                      {i > 0 && (
                        <View
                          style={[
                            styles.divider,
                            styles.yearDivider,
                            { backgroundColor: t.border },
                          ]}
                        />
                      )}
                      <YearRow year={y} onPress={() => openYear(y)} />
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
      <AddZakatPaymentSheet visible={adding} onClose={() => setAdding(false)} />
    </SafeAreaView>
  );
}

function Key({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: string;
}) {
  const t = useTheme();
  return (
    <View
      style={styles.key}
      accessible
      accessibilityLabel={`${label} ${value}`}
    >
      <View style={styles.keyRow}>
        {color && <View style={[styles.swatch, { backgroundColor: color }]} />}
        <Text style={{ color: t.muted, fontSize: 13 }}>{label}</Text>
      </View>
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

function YearRow({ year, onPress }: { year: ZakatYear; onPress: () => void }) {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const settled = year.remaining <= 0;
  const status =
    year.zakat === 0
      ? "Not due"
      : settled
        ? "Paid"
        : `${formatMoney(year.remaining)} left`;
  const color = year.zakat === 0 ? t.muted : settled ? t.income : t.spend;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.yearRow, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: "600" }}>
          {year.key} AH
        </Text>
        <Text style={{ color: t.muted, fontSize: 13, marginTop: 2 }}>
          Due {format(year.due, "d MMM yyyy")}
        </Text>
      </View>
      <Text style={{ color, fontSize: 13, fontWeight: "700", marginRight: 6 }}>
        {status}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={t.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h1: { fontSize: 30, fontWeight: "800", marginBottom: 12 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  overdue: { flexDirection: "row", alignItems: "center" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ring: { alignItems: "center", marginVertical: 16 },
  left: { fontSize: 26, fontWeight: "800", maxWidth: 140 },
  legend: { flexDirection: "row", justifyContent: "space-between" },
  key: { flex: 1, alignItems: "center" },
  keyRow: { flexDirection: "row", alignItems: "center" },
  swatch: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  countdown: { flexDirection: "row", alignItems: "center" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  countdownIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  days: { fontSize: 22, fontWeight: "800" },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 8,
  },
  sectionInRow: { marginTop: 0, marginBottom: 0 },
  add: { flexDirection: "row", alignItems: "center" },
  list: { padding: 0, overflow: "hidden" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  yearDivider: { marginLeft: 16 },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
