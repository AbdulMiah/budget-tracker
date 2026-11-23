// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { SettingsScreen } from "@/screens/settings";

export default function SettingsRoute() {
  return <SettingsScreen />;
}
