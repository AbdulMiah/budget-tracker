import { router } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EyeButton } from "@/components/EyeButton";
import { InfoTip } from "@/components/InfoTip";
import { IS_DEMO } from "@/config/env";
import { BANK_COLORS, BANK_NAMES, BANKS, RADIUS, SPACING } from "@/constants";
import { BankId } from "@/constants/types";
import { useMoney } from "@/hooks/useMoney";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import { useZakat } from "@/hooks/useZakat";
import { SettingsRow } from "@/screens/settings/components/SettingsRow";
import { useAccounts } from "@/services/accounts.queries";
import { useConnectBank } from "@/services/banks.queries";
import { formatHijri } from "@/utils/hijri";

export function SettingsScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const { data: accounts = [] } = useAccounts();
  const { settings, update } = useSettings();
  const { budgetStartDay, tiltToHide, budgetLimit, categoryBudgets } = settings;
  const connectBank = useConnectBank();
  const categoryCount = Object.keys(categoryBudgets).length;
  const zakat = useZakat();
  const cardColors = { backgroundColor: t.card, borderColor: t.border };

  const connect = async (bank: BankId) => {
    try {
      await connectBank.mutateAsync(bank);
    } catch (e) {
      Alert.alert(
        "Could not connect",
        e instanceof Error ? e.message : "Unknown error"
      );
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.h1, { color: t.text }]}>Settings</Text>
          <EyeButton />
        </View>

        <Text style={[styles.section, { color: t.muted }]}>BUDGET</Text>
        <View style={[styles.card, styles.rows, cardColors]}>
          <SettingsRow
            icon="calendar-outline"
            title="Budget date"
            value={`Starts on day ${budgetStartDay}`}
            onPress={() => router.push("/budget-date")}
          />
          <View style={[styles.divider, { backgroundColor: t.border }]} />
          <SettingsRow
            icon="wallet-outline"
            title="Spending limit"
            value={
              budgetLimit === null
                ? "Not set"
                : `${formatMoney(budgetLimit)} a month${
                    categoryCount
                      ? ` · ${categoryCount} ${
                          categoryCount === 1 ? "category" : "categories"
                        }`
                      : ""
                  }`
            }
            onPress={() => router.push("/spending-limit")}
          />
        </View>

        <Text style={[styles.section, { color: t.muted }]}>ZAKAT</Text>
        <View style={[styles.card, styles.rows, cardColors]}>
          <SettingsRow
            icon="moon-outline"
            title="Zakat date and nisab"
            value={
              zakat.current
                ? `Due ${formatHijri(zakat.current.dueHijri, true)} each year`
                : zakat.nisab.threshold === null
                  ? "Add gold and silver prices"
                  : "Not started"
            }
            onPress={() => router.push("/zakat-settings")}
          />
        </View>

        <Text style={[styles.section, { color: t.muted }]}>PRIVACY</Text>
        <View style={[styles.card, styles.toggleRow, cardColors]}>
          <View style={styles.toggleText}>
            <View style={styles.tipRow}>
              <Text style={[styles.label, { color: t.text }]}>
                Tilt down to hide amounts
              </Text>
              <InfoTip
                label="Tilt down to hide amounts"
                text="Tilt your phone down towards flat to hide every balance and figure, and tilt it again to show them. You can also tap the eye button at the top of each screen."
              />
            </View>
          </View>
          <Switch
            value={tiltToHide}
            onValueChange={(on) => update({ tiltToHide: on })}
            trackColor={{ true: t.primary }}
          />
        </View>

        <Text style={[styles.section, { color: t.muted }]}>BANK ACCOUNTS</Text>
        <View style={[styles.card, cardColors]}>
          {IS_DEMO && (
            <Text style={[styles.demo, { color: t.muted }]}>
              Showing demo data. Set EXPO_PUBLIC_API_URL to your backend to
              connect real accounts.
            </Text>
          )}
          {BANKS.map((bank) => {
            const linked = accounts.filter((a) => a.bank === bank);
            return (
              <View
                key={bank}
                style={[styles.bankRow, { borderTopColor: t.border }]}
              >
                <View
                  style={[
                    styles.bankDot,
                    { backgroundColor: BANK_COLORS[bank] },
                  ]}
                />
                <View style={styles.bankText}>
                  <Text style={[styles.bankName, { color: t.text }]}>
                    {BANK_NAMES[bank]}
                  </Text>
                  <Text style={[styles.bankAccounts, { color: t.muted }]}>
                    {linked.length
                      ? linked
                          .map((a) => `${a.name} · ${formatMoney(a.balance)}`)
                          .join("\n")
                      : "Not connected"}
                  </Text>
                </View>
                {!linked.length || !IS_DEMO ? (
                  <Pressable onPress={() => connect(bank)} hitSlop={8}>
                    <Text style={[styles.connect, { color: t.primary }]}>
                      {linked.length ? "Reconnect" : "Connect"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: SPACING.four, paddingBottom: SPACING.six },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h1: { fontSize: 30, fontWeight: "800", marginBottom: SPACING.three },
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: SPACING.two,
    marginBottom: SPACING.two,
  },
  card: {
    padding: SPACING.four,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    marginBottom: SPACING.four,
  },
  rows: { paddingVertical: SPACING.one, paddingHorizontal: 0 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  toggleRow: { flexDirection: "row", alignItems: "center" },
  toggleText: { flex: 1, marginRight: SPACING.three },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 15 },
  demo: { fontSize: 13, marginBottom: SPACING.three },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bankDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.three,
  },
  bankText: { flex: 1 },
  bankName: { fontSize: 16, fontWeight: "600" },
  bankAccounts: { fontSize: 13 },
  connect: { fontWeight: "600" },
});
