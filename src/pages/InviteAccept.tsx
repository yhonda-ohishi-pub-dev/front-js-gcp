import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { createClient, createAuthTransport } from "../api/client";
import { InvitationService, type Invitation } from "../api/generated/service_pb";

export function InviteAccept() {
  const { token: inviteToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { token: authToken, isAuthenticated } = useAuthStore();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!inviteToken) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(`/invite/${inviteToken}`);
      navigate(`/login?returnTo=${returnTo}`, { replace: true });
      return;
    }

    fetchInvitation();
  }, [inviteToken, isAuthenticated]);

  const fetchInvitation = async () => {
    if (!authToken || !inviteToken) return;

    try {
      const client = createClient(InvitationService, createAuthTransport(authToken));
      const response = await client.getInvitationByToken({ token: inviteToken });

      if (response.invitation) {
        if (response.invitation.status !== "pending") {
          setError(`This invitation is ${response.invitation.status}`);
        } else {
          setInvitation(response.invitation);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!authToken || !inviteToken) return;

    setAccepting(true);
    setError(null);

    try {
      const client = createClient(InvitationService, createAuthTransport(authToken));
      await client.acceptInvitation({ token: inviteToken });
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        {success ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-600">You've joined the organization. Redirecting...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/", { replace: true })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : invitation ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Invitation</h2>
            <p className="text-gray-600 mb-6">
              You've been invited to join as <strong className="text-gray-900">{invitation.role}</strong>
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">Invited by</p>
              <p className="text-gray-900">{invitation.email}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/", { replace: true })}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {accepting ? "Accepting..." : "Accept Invitation"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
