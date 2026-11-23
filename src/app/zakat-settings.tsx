// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { ZakatSettingsScreen } from "@/screens/settings/ZakatSettings";

export default function ZakatSettingsRoute() {
  return <ZakatSettingsScreen />;
}
