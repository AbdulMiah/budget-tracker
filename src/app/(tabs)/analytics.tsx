// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { AnalyticsScreen } from "@/screens/analytics";

export default function AnalyticsRoute() {
  return <AnalyticsScreen />;
}
