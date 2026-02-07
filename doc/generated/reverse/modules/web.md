# Webアプリケーション（apps/web）

## 責務

- 対話の一覧・詳細表示（管理画面UI）
- REST APIエンドポイントの提供（対話の保存・取得・更新）
- Geminiとの思考再開チャット（SSEストリーミング）
- 洞察の保存・一覧表示
- メモのOptimistic Update編集
- Firestoreとの通信
- Vertex AI (Gemini) との通信

## ディレクトリ構造

```
apps/web/src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # ルートレイアウト（Sidebar + main）
│   ├── page.tsx                 # 対話一覧ページ [Server]
│   ├── globals.css              # グローバルスタイル（Tailwind + デザイントークン）
│   ├── conversations/
│   │   └── [id]/
│   │       ├── page.tsx         # 対話詳細ページ [Server]
│   │       └── not-found.tsx    # 404ページ
│   └── api/
│       ├── conversations/
│       │   ├── route.ts         # POST, GET
│       │   └── [id]/
│       │       ├── route.ts     # GET, PATCH
│       │       └── insights/
│       │           └── route.ts # GET
│       ├── chat/
│       │   └── route.ts         # POST (SSE Streaming)
│       └── insights/
│           └── route.ts         # POST
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # ページヘッダー [Server]
│   │   ├── Sidebar.tsx          # ナビゲーション [Client]
│   │   └── index.ts
│   └── conversations/
│       ├── ConversationList.tsx          # 対話一覧 [Server]
│       ├── ConversationCard.tsx          # 対話カード [Server]
│       ├── ConversationHeader.tsx        # 詳細ヘッダー [Server]
│       ├── ConversationDetailContent.tsx # 詳細ラッパー [Client]
│       ├── ChatHistorySection.tsx        # 対話履歴 [Server]
│       ├── MessageList.tsx              # メッセージリスト [Server]
│       ├── MessageBubble.tsx            # メッセージバブル [Server]
│       ├── SourceBadge.tsx              # ソースバッジ [Server]
│       ├── NoteSection.tsx              # メモ編集 [Client] ★Sprint 2
│       ├── InsightSection.tsx           # 洞察表示 [Client] ★Sprint 2
│       ├── ThinkResumePanel.tsx         # Gemini対話 [Client] ★Sprint 2
│       └── index.ts
│
└── lib/
    ├── api.ts                   # Server Component用 fetch
    ├── api/
    │   └── errors.ts            # エラーハンドリング共通化 ★Sprint 2改善
    ├── firebase/
    │   └── admin.ts             # Firebase Admin SDK
    ├── vertex/                  # ★Sprint 2 追加
    │   ├── gemini.ts            # Gemini API連携（ストリーミング）
    │   └── types.ts             # Vertex AI型定義
    ├── hooks/                   # ★Sprint 2 追加
    │   └── useUnsavedChangesWarning.ts
    └── utils/
        └── date.ts              # 日付ユーティリティ
```

## Server Component vs Client Component

| コンポーネント | 種別 | 理由 |
|--------------|------|------|
| page.tsx (一覧) | Server | データフェッチのみ |
| page.tsx (詳細) | Server | データフェッチのみ |
| Header | Server | 静的表示 |
| ConversationList / Card | Server | 静的表示 |
| ChatHistorySection / MessageBubble | Server | 静的表示 |
| Sidebar | **Client** | `usePathname()` でアクティブ判定 |
| ConversationDetailContent | **Client** | 洞察のfetch・状態管理 |
| NoteSection | **Client** | Optimistic Update、編集状態管理 |
| ThinkResumePanel | **Client** | SSEストリーミング、チャット状態管理 |
| InsightSection | **Client** | 動的データ表示 |

## 主要な設計パターン

### 1. Optimistic Update（NoteSection）

```
ユーザー操作 → ① UI更新(setCurrentNote) → ② API呼び出し(バックグラウンド)
  ├─ 成功: UIは既に更新済み
  └─ 失敗: ロールバック(setCurrentNote(previousNote)) + エラー表示
```

### 2. SSE ストリーミング（ThinkResumePanel ↔ /api/chat）

```
クライアント: fetch POST → ReadableStream → チャンク解析 → 段階的UI更新
サーバー: Gemini streamChat → 各チャンク → data: {"text": "..."} → data: [DONE]
```

### 3. ナビゲーションガード（useUnsavedChangesWarning）

3層のガードで未保存変更を保護:
1. `beforeunload`: ブラウザ離脱
2. クリックキャプチャ（`<a>`要素）: クライアントサイドナビゲーション
3. `popstate` + `history.pushState`: ブラウザ戻る/進むボタン

### 4. エラーハンドリング共通化（errors.ts）

```typescript
createClientErrorResponse(status, code, message, details?) // 4xx
createServerErrorResponse(error, logPrefix)                 // 5xx（詳細隠蔽）
```

## カスタムフック

| フック | ファイル | 責務 |
|-------|---------|------|
| `useUnsavedChangesWarning` | `lib/hooks/useUnsavedChangesWarning.ts` | 編集中のページ離脱防止（3層ガード） |

## デザイントークン（globals.css）

```css
:root {
  --bg-page: #FFFFFF;
  --bg-surface: #FAFAFA;
  --bg-card: #FFFFFF;
  --black-primary: #0D0D0D;
  --gray-700: #7A7A7A;
  --gray-400: #B0B0B0;
  --border: #E8E8E8;
  --red-primary: #E42313;  /* アクセントカラー */
  --green-success: #22C55E;
}
```

## 次に読むべきドキュメント

- Chrome拡張機能 → [extension.md](extension.md)
- 共通型定義 → [shared.md](shared.md)
- API仕様 → [../api.md](../api.md)
