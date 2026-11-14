import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { EyeButton } from '../components/EyeButton';
import { useTheme } from '../components/theme';
import { useTiltToHide } from '../lib/useTiltToHide';
import { useAuth, useSignedIn } from '../store/useAuth';
import { useStore } from '../store/useStore';

export default function RootLayout() {
  const t = useTheme();
  const load = useStore((s) => s.load);
  const clearBankData = useStore((s) => s.clearBankData);
  const ready = useAuth((s) => s.ready);
  const userId = useAuth((s) => s.session?.user.id);
  const signedIn = useSignedIn();
  useTiltToHide();
  // Refetch whenever a different user signs in, and drop their data when they sign out.
  useEffect(() => {
    if (!ready) return;
    if (signedIn) load();
    else clearBankData();
  }, [ready, signedIn, userId, load, clearBankData]);

  // Wait for the saved session so a signed-in user doesn't see the sign-in screen flash up.
  if (!ready) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

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
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="net-worth" options={{ ...pushed, title: 'Net worth' }} />
          <Stack.Screen name="transactions" options={{ ...pushed, title: 'Transactions' }} />
          <Stack.Screen name="budget-date" options={{ ...pushed, title: 'Budget date' }} />
          <Stack.Screen name="spending-limit" options={{ ...pushed, title: 'Spending limit' }} />
          <Stack.Screen name="recurring/index" options={{ ...pushed, title: 'Recurring payments' }} />
          <Stack.Screen name="recurring/[key]" options={{ ...pushed, title: '' }} />
          <Stack.Screen name="zakat-settings" options={{ ...pushed, title: 'Zakat settings' }} />
          <Stack.Screen name="zakat/[year]" options={{ ...pushed, title: '' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
