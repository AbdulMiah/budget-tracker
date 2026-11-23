import { DeviceMotion } from "expo-sensors";
import { useEffect } from "react";

import { useStore } from "../store/useStore";

// rotation.beta is the tilt around the phone's horizontal axis in radians:
// about π/2 held upright, 0 lying flat face up, negative once the top dips below the bottom.
// A tilt counts once the phone drops below TILTED; it must rise back above UPRIGHT before
// another tilt counts, so holding it flat doesn't keep flipping amounts on and off.
const TILTED = (20 * Math.PI) / 180;
const UPRIGHT = (35 * Math.PI) / 180;

/** While enabled in settings, each tilt of the phone down toggles hidden amounts. */
export function useTiltToHide() {
  const enabled = useStore((s) => s.tiltToHide);

  useEffect(() => {
    if (!enabled) return;
    let sub: { remove: () => void } | undefined;
    let cancelled = false;
    // Starts unarmed so opening the app while the phone lies flat doesn't toggle straight away.
    let armed = false;
    DeviceMotion.isAvailableAsync().then((available) => {
      if (!available || cancelled) return;
      DeviceMotion.setUpdateInterval(200);
      sub = DeviceMotion.addListener(({ rotation }) => {
        if (!rotation) return;
        if (rotation.beta > UPRIGHT) armed = true;
        else if (armed && rotation.beta < TILTED) {
          armed = false;
          useStore.getState().toggleAmountsHidden();
        }
      });
    });
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);
}
