import { StyleSheet, Text, View } from "react-native";

import { BANK_COLORS } from "@/constants";
import { Account } from "@/constants/types";
import { useTheme } from "@/hooks/useTheme";

/** The account's name after a dot in its bank's colour. */
export function AccountLabel({ account }: { account?: Account }) {
  const t = useTheme();
  if (!account) {
    return (
      <Text style={[styles.name, { color: t.muted }]}>Unknown account</Text>
    );
  }
  return (
    <View style={styles.row}>
      <View
        style={[styles.dot, { backgroundColor: BANK_COLORS[account.bank] }]}
      />
      <Text style={[styles.name, { color: t.muted }]} numberOfLines={1}>
        {account.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  name: { fontSize: 13 },
});
