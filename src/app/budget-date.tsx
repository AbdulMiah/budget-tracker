// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { BudgetDateScreen } from "@/screens/settings/BudgetDate";

export default function BudgetDateRoute() {
  return <BudgetDateScreen />;
}
