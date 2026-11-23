import { useState } from "react";

// Tracked separately so only a manual pull-to-refresh shows the spinner,
// not background refetches.
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  return { isRefreshing, onRefresh };
}
