import { StyleSheet, Text, View } from "react-native";

import { InfoTip } from "@/components/InfoTip";
import { SPACING } from "@/constants";
import { useTheme } from "@/hooks/useTheme";

interface SectionTitleProps {
  title: string;
  /** Explanation shown from an info icon after the title. */
  info?: string;
  marginTop?: number;
}

/** An uppercase section label, optionally with an InfoTip. */
export function SectionTitle({
  title,
  info,
  marginTop = SPACING.two,
}: SectionTitleProps) {
  const t = useTheme();
  return (
    <View style={[styles.section, { marginTop }]}>
      <Text style={[styles.text, { color: t.muted }]}>
        {title.toUpperCase()}
      </Text>
      {info && <InfoTip label={title} text={info} size={14} />}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: SPACING.two,
  },
  text: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
});
