import { useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native';
import { useTheme } from './theme';

type Props = {
  /** Pence, or null for empty. */
  value: number | null;
  /** Called with pence (or null when cleared) once editing finishes. */
  onChange: (pence: number | null) => void;
  placeholder?: string;
  accessibilityLabel: string;
  style?: StyleProp<TextStyle>;
};

const toText = (pence: number | null) => (pence === null ? '' : (pence / 100).toFixed(pence % 100 ? 2 : 0));

/** Pound amount field. It edits freely and only reports the value when the field loses focus. */
export function MoneyInput({ value, onChange, placeholder = '0', accessibilityLabel, style }: Props) {
  const t = useTheme();
  const [text, setText] = useState(() => toText(value));

  const commit = () => {
    const cleaned = text.replace(/[£,\s]/g, '');
    if (!cleaned) {
      onChange(null);
      return;
    }
    const pounds = Number(cleaned);
    if (!Number.isFinite(pounds) || pounds < 0) {
      // Not a valid amount: put back what was there.
      setText(toText(value));
      return;
    }
    const pence = Math.round(pounds * 100);
    setText(toText(pence));
    onChange(pence);
  };

  return (
    <View style={[styles.field, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={{ color: t.muted, fontSize: 15 }}>£</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onEndEditing={commit}
        placeholder={placeholder}
        placeholderTextColor={t.muted}
        keyboardType="decimal-pad"
        returnKeyType="done"
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, { color: t.text }, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 8, paddingLeft: 4 },
});
