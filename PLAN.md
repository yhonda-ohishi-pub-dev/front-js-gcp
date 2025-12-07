# Frontend実装計画書

## 概要

postgres-prod (Cloud Run + Go + gRPC) バックエンドに接続するReact Frontendを
Cloudflare Pagesで実装する。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Pages                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 React SPA (Vite)                          │  │
│  │  - Tailwind CSS                                           │  │
│  │  - gRPC-Web Client                                        │  │
│  │  - React Router                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ gRPC-Web (HTTP/1.1)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Cloud Run                                │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │  Envoy Proxy    │───▶│     postgres-prod (Go)              │ │
│  │  (gRPC-Web変換) │    │     - 28 gRPC Services              │ │
│  │  Port: 8081     │    │     - OAuth2 (Google/LINE)          │ │
│  └─────────────────┘    │     Port: 8080                      │ │
│                         └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Cloud SQL PostgreSQL
```

## Phase 1: プロジェクト基盤構築

### 1.1 プロジェクト初期化
```bash
npm create cloudflare@latest front-js -- --framework=react
cd front-js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1.2 依存パッケージ
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "@bufbuild/protobuf": "^2.x",
    "grpc-web": "^1.5.x",
    "google-protobuf": "^3.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "tailwindcss": "^3.x",
    "typescript": "^5.x",
    "protoc-gen-grpc-web": "^1.5.x"
  }
}
```

### 1.3 プロジェクト構成
```
front-js/
├── src/
│   ├── main.tsx                 # エントリーポイント
│   ├── App.tsx                  # ルートコンポーネント
│   ├── api/
│   │   ├── client.ts            # gRPC-Webクライアント設定
│   │   └── generated/           # protoc生成コード
│   ├── components/
│   │   ├── ui/                  # 共通UIコンポーネント
│   │   ├── layout/              # レイアウト
│   │   └── features/            # 機能別コンポーネント
│   ├── hooks/
│   │   ├── useAuth.ts           # 認証フック
│   │   └── useApi.ts            # API呼び出しフック
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── stores/
│   │   └── authStore.ts         # 認証状態管理
│   └── styles/
│       └── globals.css          # Tailwind imports
├── public/
├── wrangler.toml                # Cloudflare設定
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Phase 2: gRPC-Web クライアント生成

### 2.1 Protobufコード生成スクリプト
```bash
# proto/service.proto から TypeScript クライアントを生成
protoc -I=../postgres-prod/proto \
  --js_out=import_style=commonjs:./src/api/generated \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:./src/api/generated \
  ../postgres-prod/proto/service.proto
```

### 2.2 gRPC-Webクライアント設定
```typescript
// src/api/client.ts
import { OrganizationServiceClient } from './generated/ServiceServiceClientPb';

const GRPC_WEB_ENDPOINT = import.meta.env.VITE_GRPC_ENDPOINT;

// 認証インターセプター付きクライアント
export const createAuthenticatedClient = <T>(
  ClientClass: new (url: string) => T,
  token: string
): T => {
  const client = new ClientClass(GRPC_WEB_ENDPOINT);
  // メタデータにJWTトークンを追加
  return client;
};
```

## Phase 3: 認証フロー実装

### 3.1 OAuth2フロー (Google/LINE)

```
1. ユーザーが「Googleでログイン」をクリック
2. Frontend → Backend: GetAuthURL(provider: "google")
3. Backend → Frontend: auth_url
4. Frontend: window.location = auth_url
5. Google認証後、コールバックURLにリダイレクト
6. Frontend → Backend: AuthWithGoogle(code: "xxx")
7. Backend → Frontend: JWT token + user info
8. Frontend: JWTをlocalStorageに保存
```

### 3.2 認証状態管理
```typescript
// src/stores/authStore.ts
interface AuthState {
  token: string | null;
  user: AppUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AppUser) => void;
  logout: () => void;
}
```

## Phase 4: ページ/機能実装

### 4.1 ページ一覧

| ページ | パス | 説明 |
|--------|------|------|
| Login | /login | OAuth2ログイン選択 |
| OAuth Callback | /auth/callback | OAuth2コールバック処理 |
| Dashboard | / | ダッシュボード |
| Organizations | /organizations | 組織管理 |
| Users | /users | ユーザー管理 |
| Cars | /cars | 車両管理 (IchibanCar) |
| Inspections | /inspections | 車検管理 |
| Files | /files | ファイル管理 |
| KUDG | /kudg/* | KUDG関連機能 |

### 4.2 主要コンポーネント

```
components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Table.tsx
│   ├── Modal.tsx
│   ├── Card.tsx
│   └── Loading.tsx
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── MainLayout.tsx
└── features/
    ├── auth/
    │   ├── LoginForm.tsx
    │   └── OAuthButtons.tsx
    ├── organizations/
    │   ├── OrganizationList.tsx
    │   └── OrganizationForm.tsx
    ├── cars/
    │   ├── CarList.tsx
    │   └── CarForm.tsx
    └── ...
```

## Phase 5: Backend側の変更 (Envoyプロキシ追加)

### 5.1 Envoy設定 (envoy.yaml)
```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8081
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                codec_type: AUTO
                stat_prefix: ingress_http
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: local_service
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: grpc_service
                      cors:
                        allow_origin_string_match:
                          - prefix: "*"
                        allow_methods: GET, PUT, DELETE, POST, OPTIONS
                        allow_headers: keep-alive,user-agent,cache-control,content-type,content-transfer-encoding,x-grpc-web,grpc-timeout,authorization
                        expose_headers: grpc-status,grpc-message
                http_filters:
                  - name: envoy.filters.http.grpc_web
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.grpc_web.v3.GrpcWeb
                  - name: envoy.filters.http.cors
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.Cors
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters:
    - name: grpc_service
      connect_timeout: 0.25s
      type: LOGICAL_DNS
      lb_policy: ROUND_ROBIN
      http2_protocol_options: {}
      load_assignment:
        cluster_name: grpc_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: 127.0.0.1
                      port_value: 8080
```

### 5.2 Cloud Run デプロイ構成
```yaml
# cloudbuild.yaml への追加
# Envoyをサイドカーとして起動
```

## Phase 6: Cloudflare Pages デプロイ

### 6.1 wrangler.toml
```toml
name = "front-js"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./dist"

[vars]
VITE_GRPC_ENDPOINT = "https://your-backend.run.app:8081"
```

### 6.2 ビルド & デプロイ
```bash
npm run build
npx wrangler pages deploy dist
```

## 実装順序

1. **Week 1: 基盤構築**
   - [ ] プロジェクト初期化 (Vite + React + Tailwind)
   - [ ] gRPC-Web クライアント生成
   - [ ] 基本レイアウト作成

2. **Week 2: 認証**
   - [ ] OAuth2フロー実装 (Google)
   - [ ] OAuth2フロー実装 (LINE)
   - [ ] JWT管理、認証状態管理

3. **Week 3: コア機能**
   - [ ] Organization CRUD
   - [ ] User管理
   - [ ] ダッシュボード

4. **Week 4: 業務機能**
   - [ ] 車両管理 (IchibanCar)
   - [ ] 車検管理 (CarInspection)
   - [ ] ファイル管理

5. **Week 5: 追加機能 & デプロイ**
   - [ ] KUDG機能
   - [ ] Envoyプロキシ設定
   - [ ] Cloudflare Pagesデプロイ
   - [ ] 本番環境テスト

## 環境変数

### Frontend (.env)
```
VITE_GRPC_ENDPOINT=https://api.example.com:8081
VITE_GOOGLE_CLIENT_ID=xxx
VITE_LINE_CHANNEL_ID=xxx
```

### Backend (Cloud Run)
```
# 既存の環境変数に加えて
ALLOWED_ORIGINS=https://front-js.pages.dev
```
