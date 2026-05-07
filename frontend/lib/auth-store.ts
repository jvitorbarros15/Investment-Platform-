import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => {
    if (typeof window !== "undefined") localStorage.setItem("invest_token", token);
    set({ token });
  },
  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem("invest_token");
    set({ token: null });
  },
}));

if (typeof window !== "undefined") {
  const stored = localStorage.getItem("invest_token");
  if (stored) useAuthStore.setState({ token: stored });
}
