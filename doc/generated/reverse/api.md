# API仕様

## 認証方式

**現在**: 認証なし（MVP段階、シングルユーザー想定）

**将来**: Firebase Auth（RDDに記載）

## ベースURL

- **開発環境**: `http://localhost:3000`
- **本番環境**: Cloud Run URL（未デプロイ）

## エンドポイント一覧

### 対話管理

#### `POST /api/conversations`

対話を新規保存する。

- **認証**: 不要（MVP）
- **Content-Type**: `application/json`

**リクエスト**:
```json
{
  "title": "React Hooks の使い方について",
  "source": "gemini",
  "messages": [
    {
      "id": "msg-001",
      "role": "user",
      "content": "useEffectの使い方を教えて",
      "timestamp": "2026-02-02T10:00:00.000Z"
    },
    {
      "id": "msg-002",
      "role": "assistant",
      "content": "useEffectは副作用を管理するHookです...",
      "timestamp": "2026-02-02T10:00:05.000Z"
    }
  ],
  "tags": ["React", "Hooks"],
  "note": "useEffectのクリーンアップ関数が重要"
}
```

**成功レスポンス** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "abc123xyz",
    "createdAt": "2026-02-02T10:00:10.000Z"
  }
}
```

**エラーレスポンス**:

| ステータス | コード | 説明 |
|-----------|--------|------|
| 400 | `INVALID_JSON` | 不正なJSON形式 |
| 400 | `VALIDATION_ERROR` | Zodバリデーション失敗 |
| 500 | `FIREBASE_NOT_CONFIGURED` | Firebase未設定 |
| 500 | `INTERNAL_ERROR` | サーバーエラー |

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "リクエストの形式が不正です",
    "details": {
      "fieldErrors": {
        "title": ["必須項目です"]
      }
    }
  }
}
```

---

#### `GET /api/conversations`

対話一覧を取得する。

- **認証**: 不要（MVP）
- **クエリパラメータ**:
  - `cursor` (optional): ページネーションカーソル（Document ID）

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "abc123xyz",
        "title": "React Hooks の使い方について",
        "source": "gemini",
        "messages": [...],
        "status": "active",
        "tags": ["React", "Hooks"],
        "note": "useEffectのクリーンアップ関数が重要",
        "createdAt": "2026-02-02T10:00:10.000Z",
        "updatedAt": "2026-02-02T10:00:10.000Z"
      }
    ],
    "nextCursor": "def456uvw"
  }
}
```

**ページネーション**:
- `PAGE_SIZE`: 20件
- `nextCursor` がある場合、次ページが存在
- 次ページ取得: `GET /api/conversations?cursor={nextCursor}`

---

#### `GET /api/conversations/:id`

指定IDの対話詳細を取得する。

- **認証**: 不要（MVP）
- **パスパラメータ**:
  - `id`: Firestore Document ID

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "abc123xyz",
    "title": "React Hooks の使い方について",
    "source": "gemini",
    "messages": [
      {
        "id": "msg-001",
        "role": "user",
        "content": "useEffectの使い方を教えて",
        "timestamp": "2026-02-02T10:00:00.000Z"
      },
      {
        "id": "msg-002",
        "role": "assistant",
        "content": "useEffectは副作用を管理するHookです...",
        "timestamp": "2026-02-02T10:00:05.000Z"
      }
    ],
    "status": "active",
    "tags": ["React", "Hooks"],
    "note": "useEffectのクリーンアップ関数が重要",
    "createdAt": "2026-02-02T10:00:10.000Z",
    "updatedAt": "2026-02-02T10:00:10.000Z"
  }
}
```

**エラーレスポンス**:

| ステータス | コード | 説明 |
|-----------|--------|------|
| 400 | `INVALID_ID_FORMAT` | IDフォーマット不正 |
| 404 | `NOT_FOUND` | 対話が見つからない |
| 500 | `INTERNAL_ERROR` | サーバーエラー |

---

## 型定義（Zod）

### リクエスト型

```typescript
// packages/shared/src/types/api.ts

export const SaveConversationRequestSchema = ConversationSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
```

### レスポンス型

```typescript
// 成功レスポンス共通
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

// 失敗レスポンス共通
export const ApiFailureSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});

// エラー詳細
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});
```

## エラーコード一覧

| コード | HTTP Status | 説明 |
|--------|-------------|------|
| `INVALID_JSON` | 400 | JSONパースエラー |
| `VALIDATION_ERROR` | 400 | Zodバリデーション失敗 |
| `INVALID_ID_FORMAT` | 400 | Document IDフォーマット不正 |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `FIREBASE_NOT_CONFIGURED` | 500 | Firebase未設定 |
| `INTERNAL_ERROR` | 500 | 内部サーバーエラー |

## CORS

Next.js API Routes はデフォルトで同一オリジンからのリクエストを許可。
Chrome拡張からのリクエストは `host_permissions` で許可。

## 次に読むべきドキュメント

- データ構造 → [database.md](database.md)
- モジュール詳細 → [modules/](modules/)
