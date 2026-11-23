// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { RecurringScreen } from "@/screens/recurring";

export default function RecurringRoute() {
  return <RecurringScreen />;
}
