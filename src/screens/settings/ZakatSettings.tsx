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

import { SectionTitle } from "@/components/SectionTitle";
import { useMoney } from "@/hooks/useMoney";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import { useZakat } from "@/hooks/useZakat";
import { HijriDatePicker } from "@/screens/settings/components/HijriDatePicker";
import { PriceRow } from "@/screens/settings/components/PriceRow";
import {
  formatHijri,
  fromHijri,
  hijriCalendarName,
  toHijri,
} from "@/utils/hijri";
import { GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS } from "@/utils/zakat";

export function ZakatSettingsScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const { settings, update } = useSettings();
  const { zakatStart, goldPrice, silverPrice } = settings;
  const cardColors = { backgroundColor: t.card, borderColor: t.border };
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
          onPress: () => update({ zakatStart: null }),
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
        <View style={[styles.card, cardColors]}>
          <PriceRow
            label="Gold"
            value={goldPrice}
            onChange={(pence) => update({ goldPrice: pence })}
            nisab={nisab.gold === null ? null : formatMoney(nisab.gold)}
          />
          <PriceRow
            label="Silver"
            value={silverPrice}
            onChange={(pence) => update({ silverPrice: pence })}
            nisab={nisab.silver === null ? null : formatMoney(nisab.silver)}
          />
        </View>

        <SectionTitle
          title="Zakat date"
          info={`The day your wealth first reached nisab. Zakat falls due on this date every lunar year. Pick an earlier date to track previous years too.\n\nDates use the ${hijriCalendarName} calendar, which can differ by a day or so from local moon sighting.`}
        />
        <View style={[styles.card, cardColors]}>
          {start && current && (
            <Text style={[styles.started, { color: t.text }]}>
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
                update({ zakatStart: format(fromHijri(h), "yyyy-MM-dd") })
              }
            />
          ) : (
            <Text style={[styles.message, { color: t.text }]}>
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
            style={[styles.card, styles.stop, cardColors]}
          >
            <Text style={[styles.stopText, { color: t.spend }]}>
              Stop tracking zakat
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  started: { fontSize: 15, fontWeight: "600", marginBottom: 14 },
  message: { fontSize: 14 },
  stop: { alignItems: "center", paddingVertical: 14 },
  stopText: { fontSize: 16, fontWeight: "600" },
});
