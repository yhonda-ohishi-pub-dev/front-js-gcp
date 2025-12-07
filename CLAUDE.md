# CLAUDE.md

このファイルはClaude Code (claude.ai/code) がこのリポジトリを理解するためのガイドです。

## プロジェクト概要

GCPバックエンド用のReact SPAフロントエンド。gRPC-Web経由でバックエンド (`postgres-prod`) と通信する。

## 技術スタック

- React 19 + TypeScript + Vite 7
- Tailwind CSS 4 (PostCSS経由)
- Zustand (状態管理)
- Connect-Web / gRPC-Web (API通信)
- React Router 7
- Cloudflare Pages (ホスティング)

## 開発コマンド

```bash
npm run dev      # 開発サーバー (localhost:5173)
npm run build    # プロダクションビルド
npm run lint     # ESLint
npm run proto    # Protocol Buffers 生成 (buf generate)
npm run deploy   # Cloudflare Pages デプロイ
```

## アーキテクチャ

### ディレクトリ構造

- `src/api/` - gRPC-Webクライアント設定と生成コード
- `src/components/` - 共通コンポーネント (InviteModal等)
- `src/components/layout/` - Header, Sidebar, MainLayout
- `src/hooks/` - カスタムフック (useOrganizations)
- `src/pages/` - ルートごとのページコンポーネント
- `src/stores/` - Zustandストア (authStore)
- `src/utils/` - ユーティリティ関数 (jwt.ts)

### 認証フロー

1. `Login.tsx` → バックエンド `/auth/google` へリダイレクト
2. Google OAuth完了 → `/auth/callback#access_token=xxx&refresh_token=xxx` にリダイレクト
3. `AuthCallback.tsx` がURLフラグメントからトークン解析
4. `authStore` にaccess_token保存 (localStorage永続化)、refresh_tokenは別途localStorage保存
5. `ProtectedRoute` がトークン有無で認証チェック

**トークン受信形式**: URLフラグメント (`#`) 経由 (セキュリティ上サーバーに送信されない)

### トークンリフレッシュ

- `useOrganizations` フックでトークン期限切れを自動検出
- リフレッシュ成功時は新しいトークンでAPI再試行
- リフレッシュ失敗時のみログアウト

### 組織管理

- `authStore` で `organizations`, `currentOrganizationId` を管理
- `Header.tsx` に組織切り替えドロップダウン
- `useOrganizations` フックで所属組織を自動取得
- localStorageで選択組織を永続化
- `x-organization-id` ヘッダーでAPI呼び出し時に組織を指定

### 招待機能

- `Organizations.tsx` - Invite/Resend/Cancel機能
- `InviteAccept.tsx` - 招待トークン検証・承認フロー (`/invite/:token`)
- `InviteModal.tsx` - 招待ダイアログ

### API通信

- `src/api/client.ts` でgRPC-Web transportを設定
- `createApiClient(service, token)` で認証付きクライアント生成
- 環境変数 `VITE_GRPC_ENDPOINT` でエンドポイント指定

### Proto生成

```bash
npm run proto  # buf generate を実行
```

入力: `../postgres-prod/proto`
出力: `src/api/generated/`

## 環境変数

- `VITE_GRPC_ENDPOINT` - バックエンドURL (デフォルト: `http://localhost:8080`)

## 関連リポジトリ

- `../postgres-prod` - Goバックエンド (gRPC + HTTP auth)

## 主要ページ

- `/login` - ログイン画面
- `/auth/callback` - OAuth認証コールバック
- `/dashboard` - ダッシュボード
- `/organizations` - 組織管理・招待
- `/users` - ユーザー管理
- `/cars` - 車両管理
- `/inspections` - 点検管理
- `/files` - ファイル管理
- `/invite/:token` - 招待承認

## 注意点

- 認証コールバックはURLフラグメント `#access_token=xxx&refresh_token=xxx` でトークンを受信
- Zustandのpersist middlewareでaccess_tokenのみlocalStorageに保存
- refresh_tokenは `localStorage.setItem("refresh_token", ...)` で別途保存
- TailwindはPostCSS経由で設定 (`@tailwindcss/postcss`)
- 組織IDは `x-organization-id` ヘッダーでAPI呼び出し時に送信
- JWTからユーザー情報を自動抽出 (`src/utils/jwt.ts`)
