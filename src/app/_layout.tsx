import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { EyeButton } from "@/components/EyeButton";
import { useTheme } from "@/hooks/useTheme";
import { useTiltToHide } from "@/hooks/useTiltToHide";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { queryClient } from "@/utils/query-client";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </SettingsProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const t = useTheme();
  useTiltToHide();

  // Pages pushed from the dashboard get a native header with a back button.
  const pushed = {
    headerShown: true,
    headerStyle: { backgroundColor: t.bg },
    headerTintColor: t.text,
    headerShadowVisible: false,
    headerBackTitle: "Back",
    headerRight: () => <EyeButton />,
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="net-worth"
        options={{ ...pushed, title: "Net worth" }}
      />
      <Stack.Screen
        name="transactions"
        options={{ ...pushed, title: "Transactions" }}
      />
      <Stack.Screen
        name="budget-date"
        options={{ ...pushed, title: "Budget date" }}
      />
      <Stack.Screen
        name="spending-limit"
        options={{ ...pushed, title: "Spending limit" }}
      />
      <Stack.Screen
        name="recurring/index"
        options={{ ...pushed, title: "Recurring payments" }}
      />
      <Stack.Screen name="recurring/[key]" options={{ ...pushed, title: "" }} />
      <Stack.Screen
        name="zakat-settings"
        options={{ ...pushed, title: "Zakat settings" }}
      />
      <Stack.Screen name="zakat/[year]" options={{ ...pushed, title: "" }} />
    </Stack>
  );
}
