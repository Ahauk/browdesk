import { useState, useCallback } from "react";
import { syncAll, syncPhotosToStorage } from "@/services/sync.service";
import { useAppStore } from "@/stores/app.store";

export function useSync() {
  const { isSyncing, setSyncing } = useAppStore();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    synced: number;
    errors: number;
  } | null>(null);

  const sync = useCallback(async () => {
    if (isSyncing) return;

    try {
      setSyncing(true);

      // Sync data
      const result = await syncAll();
      setLastResult({ synced: result.synced, errors: result.errors });

      // Sync photos to storage
      await syncPhotosToStorage();

      setLastSync(new Date().toISOString());
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  }, [isSyncing, setSyncing]);

  return {
    sync,
    isSyncing,
    lastSync,
    lastResult,
  };
}
