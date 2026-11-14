import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { EyeButton } from '../components/EyeButton';
import { useTheme } from '../components/theme';
import { useTiltToHide } from '../lib/useTiltToHide';
import { useStore } from '../store/useStore';

export default function RootLayout() {
  const t = useTheme();
  const load = useStore((s) => s.load);
  useTiltToHide();
  useEffect(() => {
    load();
  }, [load]);

  // Pages pushed from the dashboard get a native header with a back button.
  const pushed = {
    headerShown: true,
    headerStyle: { backgroundColor: t.bg },
    headerTintColor: t.text,
    headerShadowVisible: false,
    headerBackTitle: 'Back',
    headerRight: () => <EyeButton />,
  };

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="net-worth" options={{ ...pushed, title: 'Net worth' }} />
        <Stack.Screen name="transactions" options={{ ...pushed, title: 'Transactions' }} />
        <Stack.Screen name="budget-date" options={{ ...pushed, title: 'Budget date' }} />
        <Stack.Screen name="spending-limit" options={{ ...pushed, title: 'Spending limit' }} />
        <Stack.Screen name="recurring/index" options={{ ...pushed, title: 'Recurring payments' }} />
        <Stack.Screen name="recurring/[key]" options={{ ...pushed, title: '' }} />
      </Stack>
    </>
  );
}
