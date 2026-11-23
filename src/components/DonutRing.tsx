import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { useTheme } from "./theme";

// Space between segments, in pixels along the ring.
const GAP = 2;

type Props = {
  segments: { key: string; value: number; color: string }[];
  /** The value a full ring stands for; defaults to the segments' sum. Larger leaves an empty track. */
  total?: number;
  size: number;
  stroke: number;
  /** Shown in the middle of the ring. */
  children?: ReactNode;
};

/** A ring split into coloured segments, drawn clockwise from the top. */
export function DonutRing({ segments, total, size, stroke, children }: Props) {
  const t = useTheme();
  const shown = segments.filter((s) => s.value > 0);
  const full = total ?? shown.reduce((sum, s) => sum + s.value, 0);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const gap = shown.length > 1 ? GAP : 0;
  // Each segment starts where the ones before it end; anything past a full ring is cut off.
  const lengths = shown.map((s) =>
    full > 0 ? (s.value / full) * circumference : 0
  );
  const offsets = lengths.map((_, i) =>
    lengths.slice(0, i).reduce((sum, l) => sum + l, 0)
  );

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={t.border}
            strokeWidth={stroke}
            fill="none"
          />
          {shown.map((s, i) => {
            const length = Math.max(
              0,
              Math.min(lengths[i], circumference - offsets[i]) - gap
            );
            if (length <= 0) return null;
            return (
              <Circle
                key={s.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${length} ${circumference}`}
                strokeDashoffset={-offsets[i]}
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
      {children && <View style={styles.centre}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
