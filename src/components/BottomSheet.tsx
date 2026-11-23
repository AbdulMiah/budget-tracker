import { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Rendered only while visible, so state inside it starts fresh each time the sheet opens. */
  children: ReactNode;
};

/** Slide-up sheet over a dimmed backdrop; tapping the backdrop closes it. */
export function BottomSheet({ visible, onClose, children }: Props) {
  const t = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { backgroundColor: t.bg }]}>
          {visible && <Inner>{children}</Inner>}
        </View>
      </View>
    </Modal>
  );
}

function Inner({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.inner, { paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      <View style={[styles.handle, { backgroundColor: t.border }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "#0008" },
  inner: { flexShrink: 1 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 8,
  },
});
