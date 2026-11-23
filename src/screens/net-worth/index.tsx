import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/constants/theme";
import { Account } from "@/constants/types";
import { AccountList } from "@/screens/net-worth/components/AccountList";
import { NetWorthCard } from "@/screens/net-worth/components/NetWorthCard";
import { useStore } from "@/store/useStore";

export function NetWorthScreen() {
  const t = useTheme();
  const accounts = useStore((s) => s.accounts);
  // Locked while dragging across the line chart so a slightly vertical drag doesn't scroll the page.
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const showTransactions = (a: Account) =>
    router.push({ pathname: "/transactions", params: { account: a.id } });

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={scrollEnabled}
      >
        <NetWorthCard
          onScrubbingChange={(scrubbing) => setScrollEnabled(!scrubbing)}
        />
        <AccountList
          title="Current accounts"
          accounts={accounts.filter((a) => a.type === "current")}
          emptyText="No current accounts connected."
          onPressAccount={showTransactions}
        />
        <AccountList
          title="Credit cards"
          accounts={accounts.filter((a) => a.type === "credit")}
          emptyText="No credit cards connected."
          onPressAccount={showTransactions}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
});
