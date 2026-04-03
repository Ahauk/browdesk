import { useRef, useCallback } from "react";
import { syncAll, syncPhotosToStorage } from "@/services/sync.service";

export function useSync() {
  const syncingRef = useRef(false);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;

    try {
      syncingRef.current = true;
      await syncAll();
      await syncPhotosToStorage();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      syncingRef.current = false;
    }
  }, []);

  return { sync };
}
