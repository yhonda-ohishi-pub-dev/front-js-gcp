# front-js-gcp

GCPバックエンド (`postgres-prod`) 用のReactフロントエンドアプリケーション。

## 技術スタック

- **React 19** + **TypeScript**
- **Vite 7** - ビルドツール
- **Tailwind CSS 4** - スタイリング
- **Zustand** - 状態管理
- **Connect-Web (gRPC-Web)** - APIクライアント
- **React Router 7** - ルーティング
- **Cloudflare Pages** - ホスティング

## セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env

# Protocol Buffers の生成
npm run proto

# 開発サーバーの起動
npm run dev
```

## 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `VITE_GRPC_ENDPOINT` | gRPC-WebエンドポイントURL | `http://localhost:8080` |

## NPMスクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | プロダクションビルド |
| `npm run preview` | ビルド結果をプレビュー |
| `npm run lint` | ESLintを実行 |
| `npm run proto` | Protocol Buffers からTypeScriptを生成 |
| `npm run deploy` | Cloudflare Pages にデプロイ |

## プロジェクト構成

```
src/
├── api/
│   ├── client.ts          # gRPC-Webクライアント設定
│   └── generated/         # buf generate で生成されたコード
├── components/
│   └── layout/            # レイアウトコンポーネント
├── pages/                 # ページコンポーネント
│   ├── Login.tsx          # ログインページ
│   ├── AuthCallback.tsx   # OAuth認証コールバック
│   ├── Dashboard.tsx      # ダッシュボード
│   ├── Organizations.tsx  # 組織管理
│   ├── Users.tsx          # ユーザー管理
│   ├── Cars.tsx           # 車両管理
│   ├── Inspections.tsx    # 検査管理
│   └── Files.tsx          # ファイル管理
├── stores/
│   └── authStore.ts       # 認証状態管理 (Zustand)
├── App.tsx                # ルート設定
└── main.tsx               # エントリーポイント
```

## 認証フロー

1. `/login` でGoogle OAuthボタンをクリック
2. バックエンド (`/auth/google`) にリダイレクト
3. Google認証完了後、`/auth/callback#access_token=xxx&refresh_token=xxx` にリダイレクト
4. URLフラグメントからトークンを解析
5. access_tokenをZustandストア (localStorage永続化) に保存
6. 保護されたルートへアクセス可能に

## 関連リポジトリ

- **postgres-prod** (`../postgres-prod`) - GoバックエンドAPI (gRPC + HTTP)

## デプロイ

```bash
npm run deploy
```

Cloudflare Pagesにデプロイされます。本番環境の環境変数はCloudflareダッシュボードで設定してください。
