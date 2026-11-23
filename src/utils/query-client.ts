import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState } from "react-native";

// Bank data is synced by the backend a few times a day, so a few minutes'
// staleness is fine and avoids refetching on every app switch.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60_000 },
  },
});

// React Native has no window focus; treat the app being in the foreground as focused.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener("change", (state) =>
    handleFocus(state === "active")
  );
  return () => subscription.remove();
});
