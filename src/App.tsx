import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import {
  Login,
  AuthCallback,
  Dashboard,
  Organizations,
  Users,
  Cars,
  Inspections,
  Files,
  InviteAccept,
  Reflection,
} from "./pages";
import { useAuthStore } from "./stores/authStore";
import { useOrganizations } from "./hooks/useOrganizations";
import { useAutoRefresh } from "./hooks/useAutoRefresh";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// 認証状態の初期化と組織取得を行うラッパーコンポーネント
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useAutoRefresh();
  useOrganizations();

  // トークンリフレッシュ完了まで待機
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/invite/:token" element={<InviteAccept />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="users" element={<Users />} />
            <Route path="cars" element={<Cars />} />
            <Route path="inspections" element={<Inspections />} />
            <Route path="files" element={<Files />} />
            <Route path="reflection" element={<Reflection />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
