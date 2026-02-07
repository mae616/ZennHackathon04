# セキュリティ考慮

## 認証・認可

### 現状（MVP）

- **認証**: なし（シングルユーザー想定）
- **認可**: なし（全エンドポイントが公開）
- **将来**: Firebase Authentication の導入予定（RDDに記載）

### 認証追加時のマイグレーション計画

1. 既存データのオーナーシップ割り当て（単一ユーザー → userId付与）
2. APIバージョニング検討（`/api/v1/` vs ヘッダーベース）
3. 拡張機能の認証フロー追加（OAuth or トークン連携）

## データ保護

### API Key / Secret 管理

- Firebase Admin SDK の認証情報は `.env.local` で管理（`.gitignore` 対象）
- 必要な環境変数:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- **フロントエンドにAPI Keyを公開しない**（CLAUDE.md規約）

### Vertex AI 認証

- Firebase Admin SDK のサービスアカウントを使用
- `GOOGLE_CLOUD_PROJECT` 環境変数でプロジェクト指定

## 入力検証

### API Routes

| エンドポイント | 検証方式 | 詳細 |
|---------------|---------|------|
| POST /api/conversations | Zod safeParse | SaveConversationRequestSchema |
| PATCH /api/conversations/:id | Zod safeParse | UpdateConversationRequestSchema |
| GET /api/conversations/:id | ID検証関数 | isValidDocumentId() |
| POST /api/chat | Zod safeParse + 存在チェック | ChatRequestSchema |
| POST /api/insights | Zod safeParse + FK存在チェック | SaveInsightRequestSchema |

### Chrome拡張

- `escapeHtml()` によるXSS対策（DOM挿入時）
- `isCaptureMessage()` 型ガードによる不正メッセージ防止
- `FormManager.validate()` による必須項目チェック

## エラー情報の公開範囲

### クライアントエラー（4xx）

- バリデーションエラー: `fieldErrors` のみ公開（`formErrors` は非公開）
- IDフォーマットエラー: 具体的なエラーコードとメッセージ
- Not Found: 汎用メッセージ

### サーバーエラー（5xx）

- クライアントには `"サーバーエラーが発生しました"` のみ返却
- 詳細はサーバーログ（`console.error`）に出力
- Firebase/Vertex AI 未設定エラーは専用コード（`FIREBASE_NOT_CONFIGURED`, `VERTEX_AI_NOT_CONFIGURED`）で通知

## 既知のリスクと対策

| リスク | 対策 | 状態 |
|--------|------|------|
| 認証なしでの公開アクセス | Firebase Auth導入予定 | TODO (Sprint 3以降) |
| DOM解析による対話取得の脆弱性 | Content Scriptのマッチパターン制限 | 対応済み |
| XSS（Chrome拡張ポップアップ） | escapeHtml() + textContent使用 | 対応済み |
| CSRF | 認証なしのため現時点で影響なし | TODO (認証追加後) |
| Firestoreのセキュリティルール | Admin SDK使用のためサーバーサイドで完結 | 対応済み |
| 環境変数の漏洩 | .env.local + .gitignore | 対応済み |
| Vertex AI レート制限 | エラーハンドリングで対応 | 対応済み |

## 次に読むべきドキュメント

- API仕様 → [api.md](api.md)
- アーキテクチャ → [architecture.md](architecture.md)
