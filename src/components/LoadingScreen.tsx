import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

// A blank themed screen while saved state loads, so nothing flashes up first.
export function LoadingScreen() {
  const t = useTheme();
  return <View style={[styles.screen, { backgroundColor: t.bg }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
