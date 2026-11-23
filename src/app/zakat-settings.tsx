import { format, parseISO, startOfDay } from "date-fns";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HijriDatePicker } from "../components/HijriDatePicker";
import { SectionTitle } from "../components/InfoTip";
import { MoneyInput } from "../components/MoneyInput";
import { useTheme } from "../components/theme";
import {
  formatHijri,
  fromHijri,
  hijriCalendarName,
  toHijri,
} from "../lib/hijri";
import { useMoney } from "../lib/useMoney";
import { useZakat } from "../lib/useZakat";
import { GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS } from "../lib/zakat";
import { useStore } from "../store/useStore";

export default function ZakatSettingsScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const {
    zakatStart,
    setZakatStart,
    goldPrice,
    setGoldPrice,
    silverPrice,
    setSilverPrice,
  } = useStore();
  const { nisab, aboveNisab, current } = useZakat();
  const today = startOfDay(new Date());
  const start = zakatStart ? toHijri(parseISO(zakatStart)) : null;
  // Tracking can only begin once wealth reaches nisab; after that the date can always be changed.
  const canPick =
    zakatStart !== null || (nisab.threshold !== null && aboveNisab);

  const stopTracking = () =>
    Alert.alert(
      "Stop tracking zakat?",
      "Your zakat date is cleared. Payments you added are kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Stop",
          style: "destructive",
          onPress: () => setZakatStart(null),
        },
      ]
    );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <SectionTitle
          title="Gold and silver prices"
          info={`Today's price per gram in pounds. Nisab is the value of ${GOLD_NISAB_GRAMS}g of gold or ${SILVER_NISAB_GRAMS}g of silver; reaching either is enough.`}
        />
        <View
          style={[
            styles.card,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <PriceRow
            label="Gold"
            value={goldPrice}
            onChange={setGoldPrice}
            nisab={nisab.gold === null ? null : formatMoney(nisab.gold)}
          />
          <PriceRow
            label="Silver"
            value={silverPrice}
            onChange={setSilverPrice}
            nisab={nisab.silver === null ? null : formatMoney(nisab.silver)}
          />
        </View>

        <SectionTitle
          title="Zakat date"
          info={`The day your wealth first reached nisab. Zakat falls due on this date every lunar year. Pick an earlier date to track previous years too.\n\nDates use the ${hijriCalendarName} calendar, which can differ by a day or so from local moon sighting.`}
        />
        <View
          style={[
            styles.card,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          {start && current && (
            <Text
              style={{
                color: t.text,
                fontSize: 15,
                fontWeight: "600",
                marginBottom: 14,
              }}
            >
              Started {formatHijri(start)}. Next due{" "}
              {formatHijri(current.dueHijri)} (
              {format(current.due, "d MMM yyyy")}).
            </Text>
          )}
          {canPick ? (
            <HijriDatePicker
              value={start}
              maxDate={today}
              onChange={(h) =>
                setZakatStart(format(fromHijri(h), "yyyy-MM-dd"))
              }
            />
          ) : (
            <Text style={{ color: t.text, fontSize: 14 }}>
              {nisab.threshold === null
                ? "Add a gold or silver price above first, so your wealth can be checked against nisab."
                : "Your net worth is below nisab, so zakat is not fardh on you yet."}
            </Text>
          )}
        </View>

        {zakatStart && (
          <Pressable
            onPress={stopTracking}
            accessibilityRole="button"
            style={[
              styles.card,
              styles.stop,
              { backgroundColor: t.card, borderColor: t.border },
            ]}
          >
            <Text style={{ color: t.spend, fontSize: 16, fontWeight: "600" }}>
              Stop tracking zakat
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PriceRow({
  label,
  value,
  onChange,
  nisab,
}: {
  label: string;
  value: number | null;
  onChange: (pence: number | null) => void;
  nisab: string | null;
}) {
  const t = useTheme();
  return (
    <View style={[styles.priceRow, { borderTopColor: t.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 15 }}>{label}</Text>
        <Text style={{ color: t.muted, fontSize: 12, marginTop: 2 }}>
          {nisab ? `Nisab ${nisab}` : "Per gram"}
        </Text>
      </View>
      <View style={{ width: 120 }}>
        <MoneyInput
          value={value}
          onChange={onChange}
          placeholder="per gram"
          accessibilityLabel={`${label} price per gram`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stop: { alignItems: "center", paddingVertical: 14 },
});
