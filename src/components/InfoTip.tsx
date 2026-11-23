import { Ionicons } from "@expo/vector-icons";
import { ComponentRef, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useTheme } from "./theme";

type Anchor = { x: number; y: number; width: number; height: number };

const GUTTER = 16;
const ARROW = 10;

type Props = {
  /** What the tip explains, for screen readers ("About <label>"). */
  label: string;
  text: string;
  size?: number;
};

/** An info icon that shows an explanation in a bubble beside it. Tapping anywhere closes it. */
export function InfoTip({ label, text, size = 16 }: Props) {
  const t = useTheme();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const open = () =>
    ref.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ x, y, width, height })
    );
  const close = () => setAnchor(null);

  const bubbleW = Math.min(screenW - 2 * GUTTER, 300);
  const centre = anchor ? anchor.x + anchor.width / 2 : 0;
  const left = Math.min(
    Math.max(centre - bubbleW / 2, GUTTER),
    screenW - GUTTER - bubbleW
  );
  // Open downwards unless the icon is in the bottom third of the screen.
  const below = anchor ? anchor.y < screenH * 0.66 : true;
  const position = anchor
    ? below
      ? { top: anchor.y + anchor.height + ARROW }
      : { bottom: screenH - anchor.y + ARROW }
    : {};

  return (
    <>
      <Pressable
        ref={ref}
        onPress={open}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`About ${label}`}
      >
        <Ionicons
          name="information-circle-outline"
          size={size}
          color={t.muted}
        />
      </Pressable>
      <Modal
        visible={anchor !== null}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityLabel="Close"
        >
          <View
            style={[
              styles.bubble,
              position,
              { left, width: bubbleW, backgroundColor: t.text },
            ]}
          >
            <View
              style={[
                styles.arrow,
                below ? { top: -ARROW / 2 } : { bottom: -ARROW / 2 },
                { left: centre - left - ARROW / 2, backgroundColor: t.text },
              ]}
            />
            <Text style={{ color: t.bg, fontSize: 13, lineHeight: 18 }}>
              {text}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

type SectionProps = {
  title: string;
  /** Explanation shown from an info icon after the title. */
  info?: string;
  marginTop?: number;
};

/** An uppercase section label, optionally with an InfoTip. */
export function SectionTitle({ title, info, marginTop = 8 }: SectionProps) {
  const t = useTheme();
  return (
    <View style={[styles.section, { marginTop }]}>
      <Text style={[styles.sectionText, { color: t.muted }]}>
        {title.toUpperCase()}
      </Text>
      {info && <InfoTip label={title} text={info} size={14} />}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  bubble: { position: "absolute", borderRadius: 12, padding: 12 },
  arrow: {
    position: "absolute",
    width: ARROW,
    height: ARROW,
    transform: [{ rotate: "45deg" }],
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
});
