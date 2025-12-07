import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";

const GRPC_ENDPOINT = import.meta.env.VITE_GRPC_ENDPOINT || "http://localhost:8080";

// gRPC-Web transport
const transport = createGrpcWebTransport({
  baseUrl: GRPC_ENDPOINT,
});

// Create authenticated transport with JWT token
export function createAuthTransport(token: string) {
  return createGrpcWebTransport({
    baseUrl: GRPC_ENDPOINT,
    interceptors: [
      (next) => async (req) => {
        req.header.set("Authorization", `Bearer ${token}`);
        return next(req);
      },
    ],
  });
}

// Generic client factory
export function createApiClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  token?: string
) {
  const t = token ? createAuthTransport(token) : transport;
  return createClient(service, t);
}

export { transport, createClient };
