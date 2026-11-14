import * as Haptics from 'expo-haptics';
import { ReactNode, useMemo, useState } from 'react';
import { Animated, PanResponder, StyleProp, useWindowDimensions, ViewStyle } from 'react-native';

// How far a finger must travel sideways before the swipe counts.
const TRIGGER = 60;

type Props = {
  /** -1 for a swipe right (earlier period), +1 for a swipe left (later period). */
  onStep: (dir: 1 | -1) => void;
  /** False when there is no period that way, e.g. the next one is in the future; the card then bounces back. */
  canStep: (dir: 1 | -1) => boolean;
  /** Optional value that tracks the finger's sideways travel and springs back to 0 on release, for linked indicators. */
  drag?: Animated.Value;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Follows a horizontal swipe and steps to the previous or next period when it is long enough.
 * Mostly vertical drags are left alone so the page still scrolls.
 * Pass memoized callbacks so the gesture handler isn't rebuilt on every render.
 */
export function SwipeablePeriod({ onStep, canStep, drag, style, children }: Props) {
  const { width } = useWindowDimensions();
  const [x] = useState(() => new Animated.Value(0));
  const responder = useMemo(() => {
    const settle = () => Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      // Resist the drag a little so it feels attached to the card rather than flung.
      onPanResponderMove: (_, g) => {
        x.setValue(g.dx * 0.6);
        drag?.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        // A springy release with some overshoot gives linked indicators their snap.
        if (drag) Animated.spring(drag, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 14 }).start();
        const dir = g.dx <= -TRIGGER ? 1 : g.dx >= TRIGGER ? -1 : 0;
        if (!dir || !canStep(dir)) return settle();
        Animated.timing(x, { toValue: -dir * width, duration: 140, useNativeDriver: true }).start(() => {
          onStep(dir);
          Haptics.selectionAsync().catch(() => {});
          // Bring the new period in from the opposite side.
          x.setValue(dir * width);
          Animated.timing(x, { toValue: 0, duration: 180, useNativeDriver: true }).start();
        });
      },
      onPanResponderTerminate: () => {
        settle();
        drag?.setValue(0);
      },
    });
  }, [x, drag, width, onStep, canStep]);

  const opacity = x.interpolate({ inputRange: [-width, 0, width], outputRange: [0, 1, 0] });

  return (
    <Animated.View style={[style, { transform: [{ translateX: x }], opacity }]} {...responder.panHandlers}>
      {children}
    </Animated.View>
  );
}
