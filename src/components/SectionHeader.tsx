import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './theme';

type Props = { title: string; onSeeAll?: () => void };

export function SectionHeader({ title, onSeeAll }: Props) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: t.text }]}>{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={10} accessibilityRole="button" accessibilityLabel={`See all ${title}`}>
          <Text style={{ color: t.primary, fontSize: 15, fontWeight: '600' }}>See all</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '700' },
});
