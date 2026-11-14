import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from './theme';

const DOT = 7;
const PILL = 18;
const GAP = 8;
// Finger travel at which the pill has leaned as far towards a neighbour as it goes.
const REACH = 160;
// How far the pill leans, as a share of the distance to the neighbouring dot.
const LEAN = (DOT + GAP) * 0.45;
const FADED = 0.35;

type Props = {
  /** Sideways finger travel from the swipeable card; positive is a swipe right (earlier period). */
  drag: Animated.Value;
  /** False on the current period, where there is nothing later to swipe to. */
  hasNext: boolean;
};

/**
 * Carousel dots: the selected period as a pill, with a faded dot either side to show there are
 * more periods before and after. On the current period there is nothing after, so that dot is
 * left out. While swiping, the pill is drawn towards the neighbour it's heading for, which
 * brightens, then it springs back like a magnet when the finger lifts.
 */
export function PeriodDots({ drag, hasNext }: Props) {
  const t = useTheme();
  // Leaning right is towards the later period, which a swipe left (negative drag) asks for.
  const lean = drag.interpolate({
    inputRange: [-REACH, 0, REACH],
    outputRange: [hasNext ? LEAN : 0, 0, -LEAN],
    extrapolate: 'clamp',
  });
  const stretch = drag.interpolate({
    inputRange: [-REACH, 0, REACH],
    outputRange: [hasNext ? 1.35 : 1, 1, 1.35],
    extrapolate: 'clamp',
  });
  const before = drag.interpolate({ inputRange: [0, REACH], outputRange: [FADED, 0.8], extrapolate: 'clamp' });
  const after = drag.interpolate({ inputRange: [-REACH, 0], outputRange: [0.8, FADED], extrapolate: 'clamp' });

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={hasNext ? 'Earlier period. Swipe the chart to change period' : 'Current period. Swipe the chart to see earlier periods'}
    >
      <Animated.View style={[styles.dot, { backgroundColor: t.muted, opacity: before }]} />
      <Animated.View
        style={[styles.pill, { backgroundColor: t.text, transform: [{ translateX: lean }, { scaleX: stretch }] }]}
      />
      {hasNext && <Animated.View style={[styles.dot, { backgroundColor: t.muted, opacity: after }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, gap: GAP },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  pill: { width: PILL, height: DOT, borderRadius: DOT / 2 },
});
