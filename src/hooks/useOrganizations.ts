import { useEffect, useRef } from "react";
import { useAuthStore, type UserOrg } from "../stores/authStore";
import { createClient, createAuthTransport } from "../api/client";
import {
  UserOrganizationService,
  OrganizationService,
  AuthService,
} from "../api/generated/service_pb";
import { createGrpcWebTransport } from "@connectrpc/connect-web";

const GRPC_ENDPOINT =
  import.meta.env.VITE_GRPC_ENDPOINT || "http://localhost:8080";

/**
 * リフレッシュトークンでアクセストークンを更新する
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    return null;
  }

  try {
    const transport = createGrpcWebTransport({ baseUrl: GRPC_ENDPOINT });
    const authClient = createClient(AuthService, transport);
    const response = await authClient.refreshToken({ refreshToken });
    return response.accessToken;
  } catch (err) {
    console.error("Failed to refresh token:", err);
    return null;
  }
}

/**
 * ユーザーの所属組織を取得してstoreにセットするフック
 * 認証済みの場合、マウント時および認証状態変更時に組織を取得する
 */
export function useOrganizations() {
  const { token, user, isAuthenticated, setOrganizations, organizations, logout, login } =
    useAuthStore();
  const fetchedRef = useRef(false);

  useEffect(() => {
    // 未認証またはユーザー情報がない場合はスキップ
    if (!isAuthenticated || !token || !user) {
      return;
    }

    // 既にフェッチ済みならスキップ（組織が0件の場合も再取得しない）
    if (fetchedRef.current) {
      return;
    }

    const fetchOrganizationsWithToken = async (accessToken: string) => {
      // UserOrganizationServiceで所属組織一覧を取得
      const userOrgClient = createClient(
        UserOrganizationService,
        createAuthTransport(accessToken)
      );
      const userOrgsResponse = await userOrgClient.listUserOrganizationsByUser({
        userId: user.id,
      });

      // 組織IDリストから組織詳細を取得
      const orgIds = userOrgsResponse.userOrganizations.map(
        (uo) => uo.organizationId
      );

      if (orgIds.length === 0) {
        setOrganizations([]);
        return;
      }

      // 各組織の詳細を取得
      const orgClient = createClient(
        OrganizationService,
        createAuthTransport(accessToken)
      );
      const orgs: UserOrg[] = [];

      for (const userOrg of userOrgsResponse.userOrganizations) {
        try {
          const orgResponse = await orgClient.getOrganization({
            id: userOrg.organizationId,
          });
          if (orgResponse.organization) {
            orgs.push({
              id: orgResponse.organization.id,
              name: orgResponse.organization.name,
              role: userOrg.role,
              isDefault: userOrg.isDefault,
            });
          }
        } catch {
          // 個別の組織取得エラーは無視
        }
      }

      setOrganizations(orgs);
    };

    const fetchOrganizations = async () => {
      try {
        fetchedRef.current = true;
        await fetchOrganizationsWithToken(token);
      } catch (err: unknown) {
        console.error("Failed to fetch organizations:", err);

        // トークン期限切れの場合はリフレッシュを試みる
        if (err && typeof err === "object" && "message" in err) {
          const message = (err as { message: string }).message;
          if (message.includes("expired") || message.includes("unauthenticated")) {
            console.log("Token expired, attempting refresh...");
            const newToken = await refreshAccessToken();
            if (newToken) {
              console.log("Token refreshed successfully");
              login(newToken);
              // 新しいトークンで再取得
              try {
                await fetchOrganizationsWithToken(newToken);
                return;
              } catch (retryErr) {
                console.error("Failed to fetch organizations after refresh:", retryErr);
              }
            }
            // リフレッシュ失敗時はログアウト
            console.log("Token refresh failed, logging out...");
            logout();
          }
        }
        fetchedRef.current = false; // エラー時は再取得を許可
      }
    };

    fetchOrganizations();
  }, [isAuthenticated, token, user, setOrganizations, logout, login]);

  // ログアウト時にフェッチ済みフラグをリセット
  useEffect(() => {
    if (!isAuthenticated) {
      fetchedRef.current = false;
    }
  }, [isAuthenticated]);

  return { organizations };
}
