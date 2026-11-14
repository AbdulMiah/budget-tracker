import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './theme';

type Props = {
  visible: boolean;
  title: string;
  options: string[];
  /** Currently selected options; empty means no filter. */
  selected: string[];
  searchable?: boolean;
  onApply: (values: string[]) => void;
  onClose: () => void;
};

/** Full-screen multi-select list. Changes apply on Done; dismissing discards them. */
export function PickerModal({ visible, onClose, ...rest }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {visible && <Body onClose={onClose} {...rest} />}
    </Modal>
  );
}

function Body({ title, options, selected, searchable, onApply, onClose }: Omit<Props, 'visible'>) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(() => new Set(selected));
  const shown = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query],
  );

  const toggle = (value: string) =>
    setDraft((d) => {
      const next = new Set(d);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const done = () => {
    // Keep the options' order so chip labels and filters are stable.
    onApply(options.filter((o) => draft.has(o)));
    onClose();
  };

  return (
    <SafeAreaView style={[styles.sheet, { backgroundColor: t.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => setDraft(new Set())} disabled={!draft.size} hitSlop={12}>
          <Text style={{ color: draft.size ? t.primary : t.muted, fontSize: 16 }}>Clear</Text>
        </Pressable>
        <Text style={[styles.title, { color: t.text }]}>
          {title}
          {draft.size ? ` (${draft.size})` : ''}
        </Text>
        <Pressable onPress={done} hitSlop={12}>
          <Text style={{ color: t.primary, fontSize: 16, fontWeight: '700' }}>Done</Text>
        </Pressable>
      </View>
      {searchable && (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={t.muted}
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={[styles.search, { backgroundColor: t.card, color: t.text, borderColor: t.border }]}
        />
      )}
      <FlatList
        data={shown}
        keyExtractor={(o) => o}
        renderItem={({ item }) => {
          const on = draft.has(item);
          return (
            <Pressable
              onPress={() => toggle(item)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={[styles.row, { borderBottomColor: t.border }]}
            >
              <Text style={{ color: t.text, fontSize: 16, fontWeight: on ? '700' : '400', flex: 1 }}>{item}</Text>
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={24} color={on ? t.primary : t.muted} />
            </Pressable>
          );
        }}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  search: { marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
