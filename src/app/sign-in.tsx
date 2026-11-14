import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../components/theme';
import { supabase } from '../lib/supabase';

type Mode = 'sign-in' | 'sign-up';

export default function SignInScreen() {
  const t = useTheme();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const submit = async () => {
    if (!supabase || busy) return;
    if (!email.trim() || !password) {
      setMessage({ text: 'Enter your email and password.', error: true });
      return;
    }
    setBusy(true);
    setMessage(null);
    const credentials = { email: email.trim(), password };
    const { data, error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);
    setBusy(false);
    if (error) setMessage({ text: error.message, error: true });
    // With email confirmation on, sign-up returns no session until the link is opened.
    else if (mode === 'sign-up' && !data.session) {
      setMessage({ text: 'Check your email to confirm your account, then sign in.', error: false });
      setMode('sign-in');
    }
    // Otherwise the root layout's guard moves on to the app.
  };

  const input = [styles.input, { backgroundColor: t.card, color: t.text, borderColor: t.border }];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.content}>
        <Text style={[styles.h1, { color: t.text }]}>Budget</Text>
        <Text style={[styles.subtitle, { color: t.muted }]}>
          {mode === 'sign-in' ? 'Sign in to see your accounts.' : 'Create an account to link your banks.'}
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={t.muted}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
          style={input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={t.muted}
          secureTextEntry
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          textContentType={mode === 'sign-in' ? 'password' : 'newPassword'}
          returnKeyType="go"
          onSubmitEditing={submit}
          style={input}
        />

        {message && (
          <Text style={[styles.message, { color: message.error ? t.spend : t.muted }]}>{message.text}</Text>
        )}

        <Pressable
          onPress={submit}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, { backgroundColor: t.primary, opacity: pressed || busy ? 0.7 : 1 }]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            setMessage(null);
          }}
          hitSlop={8}
          style={styles.switch}
        >
          <Text style={{ color: t.primary, fontWeight: '600' }}>
            {mode === 'sign-in' ? 'Create an account' : 'I already have an account'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 16 },
  h1: { fontSize: 30, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 15, marginBottom: 24 },
  input: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 16, marginBottom: 12 },
  message: { fontSize: 13, marginBottom: 12 },
  button: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switch: { alignSelf: 'center', marginTop: 20 },
});
