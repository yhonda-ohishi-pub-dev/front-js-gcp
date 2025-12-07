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

// 組織情報（表示用）
export interface UserOrg {
  id: string;
  name: string;
  role: string;
  isDefault: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  organizations: UserOrg[];
  currentOrganizationId: string | null;
  login: (token: string) => void;
  logout: () => void;
  setOrganizations: (orgs: UserOrg[]) => void;
  setCurrentOrganizationId: (orgId: string) => void;
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

// 選択中の組織IDをlocalStorageに保存するキー
const CURRENT_ORG_KEY = "current_organization_id";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      organizations: [],
      currentOrganizationId: localStorage.getItem(CURRENT_ORG_KEY),
      login: (token: string) => {
        const user = extractUserFromToken(token);
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem("refresh_token");
        localStorage.removeItem(CURRENT_ORG_KEY);
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          organizations: [],
          currentOrganizationId: null,
        });
      },
      setOrganizations: (orgs: UserOrg[]) => {
        set((state) => {
          // currentOrganizationIdが設定されていないか、所属していない組織の場合はデフォルトを選択
          let newCurrentOrgId = state.currentOrganizationId;
          const belongsToCurrentOrg = orgs.some(
            (org) => org.id === state.currentOrganizationId
          );
          if (!newCurrentOrgId || !belongsToCurrentOrg) {
            // isDefaultの組織があればそれを、なければ最初の組織を選択
            const defaultOrg = orgs.find((org) => org.isDefault) || orgs[0];
            newCurrentOrgId = defaultOrg?.id || null;
            if (newCurrentOrgId) {
              localStorage.setItem(CURRENT_ORG_KEY, newCurrentOrgId);
            }
          }
          return { organizations: orgs, currentOrganizationId: newCurrentOrgId };
        });
      },
      setCurrentOrganizationId: (orgId: string) => {
        localStorage.setItem(CURRENT_ORG_KEY, orgId);
        set({ currentOrganizationId: orgId });
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
        // 組織IDもlocalStorageから復元
        const savedOrgId = localStorage.getItem(CURRENT_ORG_KEY);
        if (savedOrgId && state) {
          state.currentOrganizationId = savedOrgId;
        }
      },
    }
  )
);
