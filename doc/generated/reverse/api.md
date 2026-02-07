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

---

#### `GET /api/conversations`

対話一覧を取得する。

- **認証**: 不要（MVP）
- **クエリパラメータ**: `cursor` (optional) - ページネーションカーソル
- **ページサイズ**: 20件
- **ソート**: `updatedAt DESC`

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "conversations": [...],
    "nextCursor": "def456uvw"
  }
}
```

---

#### `GET /api/conversations/:id`

指定IDの対話詳細を取得する。

- **認証**: 不要（MVP）
- **パスパラメータ**: `id` - Firestore Document ID

---

#### `PATCH /api/conversations/:id`（Sprint 2 追加）

対話のメモを更新する。

- **認証**: 不要（MVP）
- **Content-Type**: `application/json`

**リクエスト**:
```json
{
  "note": "追記した内容"
}
```

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "updatedAt": "2026-02-08T10:00:00.000Z"
  }
}
```

---

### 思考再開チャット（Sprint 2 追加）

#### `POST /api/chat`

Geminiとのストリーミングチャット。保存した対話をコンテキストとして使用。

- **認証**: 不要（MVP）
- **Content-Type**: `application/json`
- **レスポンス**: `text/event-stream`（Server-Sent Events）

**リクエスト**:
```json
{
  "conversationId": "abc123xyz",
  "userMessage": "この設計パターンの利点は？",
  "chatHistory": [
    { "role": "user", "content": "前回の質問" },
    { "role": "model", "content": "前回の回答" }
  ]
}
```

**SSEレスポンス**:
```
data: {"text": "テキストチャンク1"}

data: {"text": "テキストチャンク2"}

data: [DONE]

```

**処理フロー**:
1. conversationId から対話を取得
2. 対話内容でシステムプロンプトを構築
3. Gemini 2.0 Flash でストリーミング生成
4. SSE形式でクライアントに逐次送信

---

### 洞察管理（Sprint 2 追加）

#### `POST /api/insights`

Geminiとの対話から洞察（Q&Aペア）を保存する。

- **認証**: 不要（MVP）
- **Content-Type**: `application/json`

**リクエスト**:
```json
{
  "conversationId": "abc123xyz",
  "question": "React Server Componentsの利点は？",
  "answer": "Server Componentsの主な利点は..."
}
```

**バリデーション**:
- `conversationId`: 必須、min(1)、実在チェック
- `question`: 必須、min(1)、max(10000)
- `answer`: 必須、min(1)、max(10000)

**成功レスポンス** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "insight_001",
    "createdAt": "2026-02-08T10:30:00.000Z"
  }
}
```

---

#### `GET /api/conversations/:id/insights`

指定対話に紐づく洞察一覧を取得する。

- **認証**: 不要（MVP）
- **ソート**: `createdAt ASC`

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "id": "insight_001",
        "conversationId": "abc123xyz",
        "question": "質問内容",
        "answer": "回答内容",
        "createdAt": "2026-02-08T10:30:00.000Z",
        "updatedAt": "2026-02-08T10:30:00.000Z"
      }
    ]
  }
}
```

---

## エラーコード一覧

| コード | HTTP Status | 説明 |
|--------|-------------|------|
| `INVALID_JSON` | 400 | JSONパースエラー |
| `VALIDATION_ERROR` | 400 | Zodバリデーション失敗 |
| `INVALID_ID_FORMAT` | 400 | Document IDフォーマット不正 |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `FIREBASE_NOT_CONFIGURED` | 500 | Firebase未設定 |
| `VERTEX_AI_NOT_CONFIGURED` | 500 | Vertex AI未設定 |
| `VERTEX_AI_API_ERROR` | 500 | Vertex AI APIエラー |
| `INTERNAL_ERROR` | 500 | 内部サーバーエラー |

## エラーレスポンス共通フォーマット

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

**セキュリティ配慮**: 500系エラーは詳細を隠蔽し、汎用メッセージのみ返却。バリデーションエラーは `fieldErrors` のみ公開（`formErrors` は非公開）。

## CORS

Next.js API Routes はデフォルトで同一オリジンからのリクエストを許可。
Chrome拡張からのリクエストは `host_permissions` で許可。

## 次に読むべきドキュメント

- データ構造 → [database.md](database.md)
- セキュリティ → [security.md](security.md)
- モジュール詳細 → [modules/](modules/)
