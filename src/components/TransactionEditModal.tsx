import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconName, TransactionAvatar } from "@/components/TransactionRow";
import { CATEGORY_COLORS, WHITE } from "@/constants";
import { CATEGORIES, Category, Override, Transaction } from "@/constants/types";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";

const ICONS: IconName[] = [
  "cart",
  "basket",
  "restaurant",
  "cafe",
  "beer",
  "pizza",
  "car",
  "bus",
  "train",
  "airplane",
  "bicycle",
  "home",
  "flash",
  "water",
  "wifi",
  "phone-portrait",
  "tv",
  "musical-notes",
  "game-controller",
  "film",
  "barbell",
  "medkit",
  "shirt",
  "gift",
  "paw",
  "school",
  "book",
  "briefcase",
  "cash",
  "card",
  "swap-horizontal",
  "heart",
];

type Props = {
  txn: Transaction | null;
  onSave: (
    txn: Transaction,
    override: Override,
    applyToMerchant: boolean
  ) => void;
  onClose: () => void;
};

export function TransactionEditModal({ txn, onSave, onClose }: Props) {
  return (
    <Modal
      visible={!!txn}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {txn && (
        <Editor key={txn.id} txn={txn} onSave={onSave} onClose={onClose} />
      )}
    </Modal>
  );
}

function Editor({ txn, onSave, onClose }: Props & { txn: Transaction }) {
  const t = useTheme();
  const { formatSigned } = useMoney();
  const [category, setCategory] = useState<Category>(txn.category);
  const [icon, setIcon] = useState<string | null>(txn.icon ?? null);
  const [applyToMerchant, setApplyToMerchant] = useState(false);
  const color = CATEGORY_COLORS[category];

  const save = () => {
    onSave(txn, { category, icon }, applyToMerchant);
    onClose();
  };

  return (
    <SafeAreaView style={[styles.sheet, { backgroundColor: t.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={[styles.headerButton, { color: t.muted }]}>Cancel</Text>
        </Pressable>
        <Pressable onPress={save} hitSlop={12}>
          <Text
            style={[styles.headerButton, styles.save, { color: t.primary }]}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <TransactionAvatar
            merchant={txn.merchant}
            icon={icon}
            color={color}
            size={64}
          />
          <Text style={[styles.merchant, { color: t.text }]}>
            {txn.merchant}
          </Text>
          <Text style={[styles.amount, { color: t.text }]}>
            {formatSigned(txn.amount)}
          </Text>
          <Text style={[styles.date, { color: t.muted }]}>
            {format(parseISO(txn.date), "EEEE d MMMM yyyy")}
          </Text>
        </View>

        <Text style={[styles.section, { color: t.muted }]}>CATEGORY</Text>
        <View style={styles.wrap}>
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.category,
                  {
                    backgroundColor: active ? CATEGORY_COLORS[c] : t.card,
                    borderColor: active ? CATEGORY_COLORS[c] : t.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: active ? WHITE : t.text },
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: t.muted }]}>ICON</Text>
        <View style={styles.wrap}>
          <IconOption
            active={icon === null}
            onPress={() => setIcon(null)}
            label="Default (initial)"
          >
            <Text
              style={[
                styles.initial,
                { color: icon === null ? WHITE : t.text },
              ]}
            >
              {txn.merchant.charAt(0).toUpperCase()}
            </Text>
          </IconOption>
          {ICONS.map((name) => (
            <IconOption
              key={name}
              active={icon === name}
              onPress={() => setIcon(name)}
              label={name}
            >
              <Ionicons
                name={name}
                size={22}
                color={icon === name ? WHITE : t.text}
              />
            </IconOption>
          ))}
        </View>

        <View
          style={[
            styles.applyRow,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <Text style={[styles.applyText, { color: t.text }]}>
            Apply to all {txn.merchant} transactions
          </Text>
          <Switch value={applyToMerchant} onValueChange={setApplyToMerchant} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function IconOption({
  active,
  onPress,
  label,
  children,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[
        styles.icon,
        {
          backgroundColor: active ? t.primary : t.card,
          borderColor: active ? t.primary : t.border,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  headerButton: { fontSize: 16 },
  save: { fontWeight: "700" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  hero: { alignItems: "center", marginBottom: 8 },
  merchant: { fontSize: 20, fontWeight: "700", marginTop: 12 },
  amount: { fontSize: 28, fontWeight: "800", marginVertical: 2 },
  date: { fontSize: 13 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  category: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: { fontWeight: "600", fontSize: 14 },
  initial: { fontWeight: "700", fontSize: 18 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  applyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  applyText: { flex: 1, marginRight: 12, fontSize: 15 },
});
