import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EyeButton } from "@/components/EyeButton";
import { useTheme } from "@/hooks/useTheme";
import { SpendingSection } from "@/screens/analytics/components/SpendingSection";

export function AnalyticsScreen() {
  const t = useTheme();
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.h1, { color: t.text }]}>Analytics</Text>
          <EyeButton />
        </View>
        <SpendingSection />
      </ScrollView>
    </SafeAreaView>
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
});
