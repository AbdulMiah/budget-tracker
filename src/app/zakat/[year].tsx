// Expo Router requires the route to live at this file path — the real
// implementation lives in src/screens so route files stay thin.
import { ZakatYearScreen } from "@/screens/zakat/ZakatYear";

export default function ZakatYearRoute() {
  return <ZakatYearScreen />;
}
