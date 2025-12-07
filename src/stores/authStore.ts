import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decodeJwt } from "../utils/jwt";

// JWTから取得するユーザー情報
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  isSuperadmin: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// JWTペイロードからユーザー情報を抽出
function extractUserFromToken(token: string): AuthUser | null {
  const payload = decodeJwt(token);
  if (!payload) return null;

  return {
    id: payload.user_id,
    email: payload.email,
    displayName: payload.display_name,
    isSuperadmin: payload.is_superadmin,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token: string) => {
        const user = extractUserFromToken(token);
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem("refresh_token");
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        // localStorageからトークンを復元した時にユーザー情報とisAuthenticatedも再構築
        if (state?.token) {
          const user = extractUserFromToken(state.token);
          if (user) {
            state.user = user;
            state.isAuthenticated = true;
          }
        }
      },
    }
  )
);
