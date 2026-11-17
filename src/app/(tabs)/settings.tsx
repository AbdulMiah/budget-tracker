import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ComponentProps } from "react";
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
import { EyeButton } from "../../components/EyeButton";
import { InfoTip } from "../../components/InfoTip";
import { BANK_COLORS, BANK_NAMES, useTheme } from "../../components/theme";
import { formatHijri } from "../../lib/hijri";
import { useMoney } from "../../lib/useMoney";
import { useZakat } from "../../lib/useZakat";
import { BankId } from "../../lib/types";
import { provider, usingDemoData } from "../../providers";
import { useStore } from "../../store/useStore";

const BANKS: BankId[] = ["barclays", "lloyds", "wise"];

export default function SettingsScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const {
    accounts,
    budgetStartDay,
    tiltToHide,
    setTiltToHide,
    budgetLimit,
    categoryBudgets,
    load,
  } = useStore();
  const categoryCount = Object.keys(categoryBudgets).length;
  const zakat = useZakat();

  const connect = async (bank: BankId) => {
    try {
      await provider.connect(bank);
      await load();
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
        <View
          style={[
            styles.card,
            styles.rows,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
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
        <View
          style={[
            styles.card,
            styles.rows,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
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
        <View
          style={[
            styles.card,
            styles.toggleRow,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={styles.tipRow}>
              <Text style={{ color: t.text, fontSize: 15 }}>
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
            onValueChange={setTiltToHide}
            trackColor={{ true: t.primary }}
          />
        </View>

        <Text style={[styles.section, { color: t.muted }]}>BANK ACCOUNTS</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          {usingDemoData && (
            <Text style={{ color: t.muted, fontSize: 13, marginBottom: 12 }}>
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
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: t.text, fontSize: 16, fontWeight: "600" }}
                  >
                    {BANK_NAMES[bank]}
                  </Text>
                  <Text style={{ color: t.muted, fontSize: 13 }}>
                    {linked.length
                      ? linked
                          .map((a) => `${a.name} · ${formatMoney(a.balance)}`)
                          .join("\n")
                      : "Not connected"}
                  </Text>
                </View>
                {!linked.length || !usingDemoData ? (
                  <Pressable onPress={() => connect(bank)} hitSlop={8}>
                    <Text style={{ color: t.primary, fontWeight: "600" }}>
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

/** A settings entry that opens its own page, showing the current value under the title. */
function SettingsRow({
  icon,
  title,
  value,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  value: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${value}`}
      style={({ pressed }) => [
        styles.settingsRow,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: t.primary + "1f" }]}>
        <Ionicons name={icon} size={18} color={t.primary} />
      </View>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={{ color: t.text, fontSize: 16 }}>{title}</Text>
        <Text
          style={{ color: t.muted, fontSize: 13, marginTop: 2 }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
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
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 8,
  },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  rows: { paddingVertical: 4, paddingHorizontal: 0 },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  toggleRow: { flexDirection: "row", alignItems: "center" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bankDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
});
