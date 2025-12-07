import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import type { Organization } from "../api/generated/service_pb";

export function Organizations() {
  const { token } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        // TODO: Implement API call using Connect client
        // const client = createApiClient(OrganizationService, token);
        // const response = await client.listOrganizations({});
        // setOrganizations(response.organizations);
        setOrganizations([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizations();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          New Organization
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {organizations.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No organizations found
            </li>
          ) : (
            organizations.map((org) => (
              <li key={org.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {org.name}
                    </p>
                    <p className="text-sm text-gray-500">{org.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                    <button className="text-sm text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
