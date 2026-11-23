// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { BudgetScreen } from "@/screens/budget";

export default function BudgetRoute() {
  return <BudgetScreen />;
}
