// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { TransactionsScreen } from "@/screens/transactions";

export default function TransactionsRoute() {
  return <TransactionsScreen />;
}
