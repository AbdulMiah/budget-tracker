// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { ZakatScreen } from "@/screens/zakat";

export default function ZakatRoute() {
  return <ZakatScreen />;
}
