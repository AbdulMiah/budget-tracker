// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { NetWorthScreen } from "@/screens/net-worth";

export default function NetWorthRoute() {
  return <NetWorthScreen />;
}
