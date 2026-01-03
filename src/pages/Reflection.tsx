import { useState } from "react";

const REFLECTION_ENDPOINT = "https://grpc_gce_tunnel.mtamaramu.com";

interface ServiceInfo {
  name: string;
}

export function Reflection() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState(REFLECTION_ENDPOINT);
  const [rawResponse, setRawResponse] = useState<string | null>(null);

  const fetchReflection = async () => {
    setLoading(true);
    setError(null);
    setServices([]);
    setRawResponse(null);

    try {
      // ListServices リクエストを作成
      // ServerReflectionRequest { list_services: "*" } をエンコード
      // field 7 (list_services) = string, tag = 0x3a, value = "*" (0x2a)
      const listServicesRequest = new Uint8Array([0x3a, 0x01, 0x2a]);

      // gRPC-Web フレーム: [compression flag (1 byte)] [message length (4 bytes)] [message]
      const frame = new Uint8Array(5 + listServicesRequest.length);
      frame[0] = 0; // no compression
      frame[1] = 0;
      frame[2] = 0;
      frame[3] = 0;
      frame[4] = listServicesRequest.length;
      frame.set(listServicesRequest, 5);

      const response = await fetch(
        `${endpoint}/grpc.reflection.v1.ServerReflection/ServerReflectionInfo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/grpc-web+proto",
            "Accept": "application/grpc-web+proto",
            "x-grpc-web": "1",
          },
          body: frame,
        }
      );

      const grpcStatus = response.headers.get("grpc-status");
      const grpcMessage = response.headers.get("grpc-message");

      if (grpcStatus && grpcStatus !== "0") {
        throw new Error(`gRPC Error ${grpcStatus}: ${grpcMessage || "Unknown error"}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // デバッグ: 生のレスポンスを16進数で表示
      const hexDump = Array.from(bytes.slice(0, 200))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');

      // テキストとしてもデコード
      const textContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      setRawResponse(`Hex (first 200 bytes): ${hexDump}\n\nText: ${textContent}`);

      // gRPC-Webレスポンスからサービス名を抽出
      // サービス名は通常 package.ServiceName の形式
      const serviceMatches = textContent.match(/[a-z][a-z0-9_]*\.[a-zA-Z][a-zA-Z0-9_]*Service/g) || [];
      const protoMatches = textContent.match(/[a-z][a-z0-9_.]*\.[A-Z][a-zA-Z0-9]*/g) || [];

      const allMatches = [...new Set([...serviceMatches, ...protoMatches])];

      if (allMatches.length > 0) {
        setServices(allMatches.map(name => ({ name })));
      } else {
        // サービスが見つからなくてもエラーにしない（rawResponseで確認可能）
        setError("サービス名のパターンが見つかりませんでした。下のRaw Responseを確認してください。");
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError("接続できませんでした。CORS設定またはエンドポイントを確認してください。");
      } else {
        setError(err instanceof Error ? err.message : "不明なエラー");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">gRPC Reflection</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-2">
            Reflection Endpoint
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
              placeholder="https://grpc_gce_tunnel.mtamaramu.com"
            />
            <button
              onClick={fetchReflection}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Fetch Services"}
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          gRPC Server Reflection APIを使用して、利用可能なサービスを取得します。
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {rawResponse && (
        <div className="bg-gray-800 text-gray-100 rounded-lg p-4 mb-6 overflow-x-auto">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Raw Response (Debug)</h3>
          <pre className="text-xs font-mono whitespace-pre-wrap break-all">{rawResponse}</pre>
        </div>
      )}

      {services.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Available Services ({services.length})
            </h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {services.map((service) => (
              <li key={service.name} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-medium">S</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900 font-mono">
                      {service.name}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && services.length === 0 && !error && !rawResponse && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">サービス情報がありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            「Fetch Services」をクリックしてgRPCサービス情報を取得してください。
          </p>
        </div>
      )}
    </div>
  );
}
