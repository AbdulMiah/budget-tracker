import { format, startOfDay } from "date-fns";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { DayCalendar } from "@/components/DayCalendar";
import { InfoTip } from "@/components/InfoTip";
import { parsePounds } from "@/components/MoneyInput";
import { useTheme } from "@/constants/theme";
import { useStore } from "@/store/useStore";

type Props = { visible: boolean; onClose: () => void };

/** Record a zakat payment made outside the linked accounts (cash, or another bank). */
export function AddZakatPaymentSheet({ visible, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Form onClose={onClose} />
    </BottomSheet>
  );
}

function Form({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const addZakatPayment = useStore((s) => s.addZakatPayment);
  const [today] = useState(() => startOfDay(new Date()));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const pence = parsePounds(amount);
  const valid = typeof pence === "number" && pence > 0;

  const save = () => {
    if (!valid) return;
    addZakatPayment({
      date: format(date, "yyyy-MM-dd"),
      amount: pence,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
          <Text style={{ color: t.primary, fontSize: 16 }}>Cancel</Text>
        </Pressable>
        <View style={styles.title}>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: "700" }}>
            Add payment
          </Text>
          <InfoTip
            label="Adding payments"
            text="For zakat paid in cash or from an account that isn't linked. Bank transactions labelled Zakat are counted automatically, so don't add those here too."
          />
        </View>
        <Pressable
          onPress={save}
          disabled={!valid}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityState={{ disabled: !valid }}
        >
          <Text
            style={{
              color: t.primary,
              fontSize: 16,
              fontWeight: "700",
              opacity: valid ? 1 : 0.35,
            }}
          >
            Save
          </Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.field,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <Text style={{ color: t.muted, fontSize: 22 }}>£</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={t.muted}
            keyboardType="decimal-pad"
            returnKeyType="done"
            autoFocus
            accessibilityLabel="Amount paid"
            style={[styles.amount, { color: t.text }]}
          />
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Note (e.g. local mosque)"
          placeholderTextColor={t.muted}
          returnKeyType="done"
          accessibilityLabel="Note"
          style={[
            styles.field,
            styles.note,
            { backgroundColor: t.card, borderColor: t.border, color: t.text },
          ]}
        />
        <View
          style={[
            styles.calendar,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <DayCalendar
            mode="day"
            value={{ start: date, end: date }}
            maxDate={today}
            onChange={(r) => setDate(r.start)}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { flexDirection: "row", alignItems: "center", gap: 6 },
  content: { paddingHorizontal: 16 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  amount: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    paddingVertical: 10,
    paddingLeft: 6,
  },
  note: { fontSize: 15, paddingVertical: 12 },
  calendar: { borderWidth: 1, borderRadius: 12, padding: 8 },
});
