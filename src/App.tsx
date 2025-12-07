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
} from "./pages";
import { useAuthStore } from "./stores/authStore";
import { useOrganizations } from "./hooks/useOrganizations";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// 組織取得を行うラッパーコンポーネント
function OrganizationProvider({ children }: { children: React.ReactNode }) {
  useOrganizations();
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <OrganizationProvider>
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
          </Route>
        </Routes>
      </OrganizationProvider>
    </BrowserRouter>
  );
}

export default App;
