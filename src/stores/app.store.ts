import { create } from "zustand";

interface AppState {
  isDbReady: boolean;
  isSyncing: boolean;
  setDbReady: (value: boolean) => void;
  setSyncing: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isDbReady: false,
  isSyncing: false,
  setDbReady: (value) => set({ isDbReady: value }),
  setSyncing: (value) => set({ isSyncing: value }),
}));
