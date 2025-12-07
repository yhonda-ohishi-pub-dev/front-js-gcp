import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser } from "../api/generated/service_pb";

interface AuthState {
  token: string | null;
  user: AppUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AppUser) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token: string, user: AppUser) =>
        set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      setToken: (token: string) => set({ token, isAuthenticated: true }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token }),
    }
  )
);
