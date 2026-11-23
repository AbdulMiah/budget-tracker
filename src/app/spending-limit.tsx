// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { SpendingLimitScreen } from "@/screens/settings/SpendingLimit";

export default function SpendingLimitRoute() {
  return <SpendingLimitScreen />;
}
