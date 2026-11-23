// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { DashboardScreen } from "@/screens/dashboard";

export default function DashboardRoute() {
  return <DashboardScreen />;
}
