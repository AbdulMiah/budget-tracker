import * as Haptics from "expo-haptics";

import { useSettings } from "@/hooks/useSettings";

export function useAmountsHidden() {
  const { settings, update } = useSettings();
  const amountsHidden = settings.amountsHidden;

  // Vibrates so the change is felt as well as seen.
  const toggleAmountsHidden = () => {
    const hidden = !amountsHidden;
    update({ amountsHidden: hidden });
    Haptics.notificationAsync(
      hidden
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    ).catch(() => undefined);
  };

  return { amountsHidden, toggleAmountsHidden };
}
