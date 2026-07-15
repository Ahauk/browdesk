import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  // ── Cloud account (Supabase) — identifies the tenant ──
  cloudSession: Session | null;
  cloudUserId: string | null;
  isCloudReady: boolean; // finished the initial getSession() check
  setCloudSession: (session: Session | null) => void;
  setCloudReady: (value: boolean) => void;

  // ── Local device lock (Face ID / PIN) — protects the device ──
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  cloudSession: null,
  cloudUserId: null,
  isCloudReady: false,
  setCloudSession: (session) =>
    set({ cloudSession: session, cloudUserId: session?.user?.id ?? null }),
  setCloudReady: (value) => set({ isCloudReady: value }),

  isAuthenticated: false,
  isLoading: true,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setLoading: (value) => set({ isLoading: value }),
}));
