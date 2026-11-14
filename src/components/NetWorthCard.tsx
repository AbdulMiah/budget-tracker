import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { downsample, netWorthSeries, niceAxis, RANGES, RangeKey, rangeStart } from '../lib/analytics';
import { useMoney } from '../lib/useMoney';
import { useStore } from '../store/useStore';
import { Chip } from './Chip';
import { useTheme } from './theme';

const Y_AXIS_WIDTH = 48;
const CARD_PADDING = 16;
const SCREEN_PADDING = 16;
const XLABEL_WIDTH = 56;

type Props = {
  /** Called with true when a drag starts and false when it ends, so a parent can lock scrolling. */
  onScrubbingChange?: (scrubbing: boolean) => void;
};

/** Net worth over a chosen range, with drag-to-inspect. */
export function NetWorthCard({ onScrubbingChange }: Props) {
  const t = useTheme();
  const { formatAxis, formatMoney, formatSigned } = useMoney();
  const { width } = useWindowDimensions();
  const { accounts, transactions } = useStore();
  const [range, setRange] = useState<RangeKey>('1M');

  const today = useMemo(() => new Date(), []);
  const chartWidth = width - 2 * (SCREEN_PADDING + CARD_PADDING) - Y_AXIS_WIDTH;

  const series = useMemo(
    () => netWorthSeries(accounts, transactions, rangeStart(range, today), today),
    [accounts, transactions, range, today],
  );

  const points = useMemo(() => downsample(series, 45), [series]);

  // The y-axis is computed here rather than by the library so the line always sits inside the plot.
  // Values are shifted down by the axis minimum, and the labels add it back.
  const axis = useMemo(() => {
    const pounds = points.map((p) => p.value / 100);
    return niceAxis(Math.min(...pounds), Math.max(...pounds));
  }, [points]);
  const line = useMemo(() => points.map((p) => ({ value: p.value / 100 - axis.axisMin })), [points, axis]);

  // Evenly spread tick positions (indices into `points`): every day for 1W, otherwise ~5 labels.
  const ticks = useMemo(() => {
    const n = points.length;
    if (n < 2) return [];
    const count = range === '1W' ? n : Math.min(5, n);
    return Array.from({ length: count }, (_, i) => Math.round((i * (n - 1)) / (count - 1)));
  }, [points, range]);

  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  const change = last - first;

  const lineSpacing = line.length > 1 ? chartWidth / (line.length - 1) : chartWidth;

  const axisText = { color: t.muted, fontSize: 10 };

  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={styles.ranges}>
        {RANGES.map((r) => (
          <Chip key={r} label={r} selected={r === range} onPress={() => setRange(r)} />
        ))}
      </View>
      <Text style={{ color: t.muted, fontSize: 13 }}>Net worth</Text>
      <Text style={[styles.big, { color: t.text }]}>{formatMoney(last)}</Text>
      <Text style={{ color: change >= 0 ? t.income : t.spend, fontWeight: '600', marginBottom: 12 }}>
        {formatSigned(change)} over {range === 'YTD' ? 'the year so far' : range}
      </Text>
      <LineChart
        data={line}
        width={chartWidth}
        height={180}
        spacing={lineSpacing}
        initialSpacing={0}
        endSpacing={0}
        yAxisLabelWidth={Y_AXIS_WIDTH}
        maxValue={axis.sections * axis.step}
        formatYLabel={(v: string) => formatAxis((Number(v) + axis.axisMin) * 100)}
        yAxisTextStyle={axisText}
        xAxisLabelsHeight={0}
        xAxisColor={t.border}
        yAxisColor="transparent"
        rulesColor={t.border}
        noOfSections={axis.sections}
        color={t.primary}
        thickness={2.5}
        hideDataPoints
        areaChart
        startFillColor={t.primary}
        endFillColor={t.primary}
        startOpacity={0.25}
        endOpacity={0.02}
        curved
        pointerConfig={{
          pointerStripColor: t.muted,
          pointerColor: t.primary,
          radius: 5,
          pointerLabelWidth: 120,
          pointerLabelHeight: 52,
          activatePointersOnLongPress: false,
          activatePointersInstantlyOnTouch: true,
          autoAdjustPointerLabelPosition: true,
          // The chart doesn't report a grant, so lock on touch-down and unlock on whichever end event fires.
          onTouchStart: () => onScrubbingChange?.(true),
          onTouchEnd: () => onScrubbingChange?.(false),
          onResponderEnd: () => onScrubbingChange?.(false),
          pointerLabelComponent: (items: { value: number }[], _secondary: unknown, index: number) => (
            <View style={[styles.tooltip, { backgroundColor: t.text }]}>
              {points[index] && (
                <Text style={{ color: t.bg, fontSize: 12, opacity: 0.75 }}>
                  {format(points[index].date, 'EEE d MMM yyyy')}
                </Text>
              )}
              <Text style={{ color: t.bg, fontWeight: '700' }}>{formatMoney(Math.round((items[0].value + axis.axisMin) * 100))}</Text>
            </View>
          ),
        }}
      />
      <View style={{ marginLeft: Y_AXIS_WIDTH, width: chartWidth, height: 16, marginTop: 6 }}>
        {ticks.map((idx, i) => {
          const frac = idx / (points.length - 1);
          const first = i === 0;
          const lastTick = i === ticks.length - 1;
          return (
            <Text
              key={idx}
              numberOfLines={1}
              style={[
                styles.xLabel,
                { color: t.muted },
                // Pin the ends inside the plot so they are never clipped; centre the rest on their point.
                first ? { left: 0 } : lastTick ? { right: 0 } : { left: frac * chartWidth - XLABEL_WIDTH / 2, textAlign: 'center' },
                { width: first || lastTick ? undefined : XLABEL_WIDTH },
              ]}
            >
              {format(points[idx].date, range === '1W' ? 'EEE' : 'd MMM')}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ranges: { flexDirection: 'row', marginBottom: 14 },
  card: { padding: CARD_PADDING, borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  big: { fontSize: 32, fontWeight: '800', marginTop: 2 },
  xLabel: { position: 'absolute', top: 0, fontSize: 10 },
  tooltip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
});
