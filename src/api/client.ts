import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";

const GRPC_ENDPOINT =
  import.meta.env.VITE_GRPC_ENDPOINT || "http://localhost:8080";

// Create authenticated transport with JWT token
export function createAuthTransport(token: string, organizationId?: string) {
  return createGrpcWebTransport({
    baseUrl: GRPC_ENDPOINT,
    interceptors: [
      (next) => async (req) => {
        req.header.set("Authorization", `Bearer ${token}`);
        if (organizationId) {
          req.header.set("x-organization-id", organizationId);
        }
        return next(req);
      },
    ],
  });
}

export { createClient };
