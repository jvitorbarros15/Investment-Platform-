import { create } from "zustand";
import type { StateCreator } from "zustand/vanilla";
import { getSupabase } from "./supabase";

interface AuthState {
  token: string | null;
  email: string | null;
  initialized: boolean;
  setSession: (token: string | null, email?: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => Promise<void>;
}

const authStoreCreator: StateCreator<AuthState> = (set) => ({
  token: null,
  email: null,
  initialized: false,
  setSession: (token, email = null) => {
    set({ token, email });
  },
  setInitialized: (initialized) => set({ initialized }),
  logout: async () => {
    await getSupabase().auth.signOut();
    set({ token: null, email: null });
  },
});

export const useAuthStore = create<AuthState>(authStoreCreator);
