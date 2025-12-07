import { useAuthStore } from "../../stores/authStore";
import { Link } from "react-router-dom";

export function Header() {
  const {
    isAuthenticated,
    user,
    logout,
    organizations,
    currentOrganizationId,
    setCurrentOrganizationId,
  } = useAuthStore();

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900">
            postgres-prod
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {organizations.length > 0 && (
                  <select
                    value={currentOrganizationId || ""}
                    onChange={(e) => setCurrentOrganizationId(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.role})
                      </option>
                    ))}
                  </select>
                )}
                {organizations.length === 0 && (
                  <span className="text-sm text-gray-400">組織なし</span>
                )}
                <span className="text-sm text-gray-600">
                  {user?.displayName || "User"}
                </span>
                <button
                  onClick={logout}
                  className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
