import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { isTokenExpired } from "../utils/jwt";
import { createClient } from "../api/client";
import { AuthService } from "../api/generated/service_pb";
import { createGrpcWebTransport } from "@connectrpc/connect-web";

const GRPC_ENDPOINT =
  import.meta.env.VITE_GRPC_ENDPOINT || "http://localhost:8080";

/**
 * アプリ起動時にトークンの有効期限をチェックし、
 * 期限切れの場合は自動でリフレッシュするフック
 */
export function useAutoRefresh() {
  const { token, isAuthenticated, login, logout } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAndRefresh = async () => {
      // 未認証の場合は何もしない
      if (!isAuthenticated || !token) {
        setIsReady(true);
        return;
      }

      // トークンが有効な場合はそのまま
      if (!isTokenExpired(token)) {
        setIsReady(true);
        return;
      }

      // トークンが期限切れの場合、リフレッシュを試みる
      console.log("Access token expired, attempting refresh...");
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        console.log("No refresh token available, logging out...");
        logout();
        setIsReady(true);
        return;
      }

      try {
        const transport = createGrpcWebTransport({ baseUrl: GRPC_ENDPOINT });
        const authClient = createClient(AuthService, transport);
        const response = await authClient.refreshToken({ refreshToken });

        if (response.accessToken) {
          console.log("Token refreshed successfully");
          login(response.accessToken);
        } else {
          console.log("Refresh failed, logging out...");
          logout();
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
        logout();
      }

      setIsReady(true);
    };

    checkAndRefresh();
  }, [token, isAuthenticated, login, logout]);

  return { isReady };
}
