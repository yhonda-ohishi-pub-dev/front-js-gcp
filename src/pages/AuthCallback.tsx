import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // URLフラグメント (#access_token=xxx&refresh_token=xxx) からトークンを取得
    const hash = location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const errorParam = params.get("error");

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (accessToken) {
      // JWTからユーザー情報を抽出してログイン
      login(accessToken);

      // refresh_tokenをlocalStorageに保存
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }

      navigate("/");
    } else {
      setError("No token received");
    }
  }, [location.hash, login, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}
