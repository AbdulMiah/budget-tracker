// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { RecurringDetailsScreen } from "@/screens/recurring/RecurringDetails";

export default function RecurringDetailsRoute() {
  return <RecurringDetailsScreen />;
}
