# 完了タスク履歴

## Phase 7: 招待機能 (2025-12-07)

### 実装タスク

- [x] `npm run proto` で最新の型定義取得
- [x] InviteModal コンポーネント作成
- [x] Organizations ページに招待機能追加
  - [x] 「Invite」ボタン
  - [x] 保留中の招待一覧表示
  - [x] キャンセル・再送機能
- [x] InviteAccept ページ作成
  - [x] トークン検証
  - [x] 組織情報表示
  - [x] Accept ボタン
- [x] App.tsx にルート追加: `/invite/:token`
- [x] テスト・デプロイ

### 作成ファイル

- `src/pages/InviteAccept.tsx` - 招待受諾ページ

### 更新ファイル

- `src/pages/Organizations.tsx` - 招待機能追加（Inviteボタン、招待一覧、キャンセル・再送）
- `src/pages/index.ts` - InviteAccept エクスポート追加
- `src/App.tsx` - `/invite/:token` ルート追加
- `src/components/InviteModal.tsx` - 既存（変更なし）

### デプロイ

- URL: https://mtama-front.mtamaramu.com
- Version ID: 053ca593-030d-43b9-a236-13df8ced0b04

---

## Phase 8: Organization切り替え機能 (2025-12-07)

### 概要

ヘッダーに組織切り替えドロップダウンを追加し、選択した組織のコンテキストでAPI操作を行う機能を実装。

### 実装タスク

- [x] authStoreに `currentOrganizationId` と `organizations` を追加
- [x] localStorageに選択組織を永続化
- [x] Header.tsx に組織切り替えドロップダウン追加
- [x] ログイン時/リロード時に所属組織を取得
- [x] デフォルト組織の自動選択（localStorage優先、なければisDefault、なければ最初の組織）
- [x] ビルド・デプロイ

### 作成ファイル

- `src/hooks/useOrganizations.ts` - 所属組織取得フック

### 更新ファイル

- `src/stores/authStore.ts` - 組織関連の状態と関数を追加（organizations, currentOrganizationId, setOrganizations, setCurrentOrganizationId）
- `src/components/layout/Header.tsx` - 組織切り替えドロップダウンを追加
- `src/App.tsx` - OrganizationProviderでアプリをラップ

### デプロイ

- URL: https://mtama-front.mtamaramu.com
- Version ID: 96eec3ef-92d4-4e5b-a6e2-1cb56fbbcfb6
