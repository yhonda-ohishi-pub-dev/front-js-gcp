import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { createClient, createAuthTransport } from "../api/client";
import {
  OrganizationService,
  InvitationService,
  type Organization,
  type Invitation,
} from "../api/generated/service_pb";
import { InviteModal } from "../components/InviteModal";

export function Organizations() {
  const { token } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteModalOrg, setInviteModalOrg] = useState<Organization | null>(null);
  const [invitations, setInvitations] = useState<Record<string, Invitation[]>>({});

  const fetchOrganizations = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const client = createClient(
        OrganizationService,
        createAuthTransport(token)
      );
      const response = await client.listOrganizations({ pageSize: 100 });
      setOrganizations(response.organizations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const client = createClient(
        OrganizationService,
        createAuthTransport(token)
      );
      await client.createOrganization({
        name: formData.name,
      });
      setIsModalOpen(false);
      setFormData({ name: "" });
      await fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this organization?")) return;

    try {
      const client = createClient(
        OrganizationService,
        createAuthTransport(token)
      );
      await client.deleteOrganization({ id });
      await fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const fetchInvitations = async (orgId: string) => {
    if (!token) return;
    try {
      const client = createClient(InvitationService, createAuthTransport(token, orgId));
      const response = await client.listInvitations({ organizationId: orgId, status: "pending" });
      setInvitations((prev) => ({ ...prev, [orgId]: response.invitations }));
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
    }
  };

  const handleInvite = async (email: string, role: string): Promise<string | null> => {
    if (!token || !inviteModalOrg) return null;
    const client = createClient(InvitationService, createAuthTransport(token, inviteModalOrg.id));
    const response = await client.createInvitation({
      organizationId: inviteModalOrg.id,
      email,
      role,
    });
    if (response.invitation) {
      await fetchInvitations(inviteModalOrg.id);
      return `${window.location.origin}/invite/${response.invitation.token}`;
    }
    return null;
  };

  const handleCancelInvitation = async (orgId: string, invitationId: string) => {
    if (!token) return;
    try {
      const client = createClient(InvitationService, createAuthTransport(token, orgId));
      await client.cancelInvitation({ id: invitationId });
      await fetchInvitations(orgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invitation");
    }
  };

  const handleResendInvitation = async (orgId: string, invitationId: string) => {
    if (!token) return;
    try {
      const client = createClient(InvitationService, createAuthTransport(token, orgId));
      await client.resendInvitation({ id: invitationId });
      await fetchInvitations(orgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invitation");
    }
  };

  const handleNameChange = (name: string) => {
    setFormData({ name });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Organization
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

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
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => {
                        setInviteModalOrg(org);
                        fetchInvitations(org.id);
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Invite
                    </button>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(org.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {/* Pending Invitations */}
                {invitations[org.id]?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Pending Invitations</p>
                    <div className="space-y-1">
                      {invitations[org.id].map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{inv.email} ({inv.role})</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResendInvitation(org.id, inv.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Resend
                            </button>
                            <button
                              onClick={() => handleCancelInvitation(org.id, inv.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* New Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                New Organization
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Organization Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Organization"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOrg && (
        <InviteModal
          organizationId={inviteModalOrg.id}
          organizationName={inviteModalOrg.name}
          isOpen={!!inviteModalOrg}
          onClose={() => setInviteModalOrg(null)}
          onInvite={handleInvite}
        />
      )}
    </div>
  );
}
