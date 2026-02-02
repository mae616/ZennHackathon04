# Chrome拡張機能（apps/extension）

## 責務

- LLMサイト（Gemini等）のDOM解析による対話キャプチャ
- ポップアップUIでの対話編集（タイトル・メモ・タグ）
- Web APIへの対話保存リクエスト送信

## ディレクトリ構造

```
apps/extension/
├── entrypoints/                  # WXT エントリポイント
│   ├── content.ts               # Content Script（DOM解析）
│   ├── background.ts            # Background Script
│   └── popup/
│       ├── index.html           # ポップアップHTML
│       ├── main.ts              # ポップアップメイン
│       ├── style.css            # スタイル
│       ├── components/
│       │   ├── form.ts          # フォーム管理
│       │   ├── loading.ts       # ローディング表示
│       │   └── tags.ts          # タグ編集UI
│       └── utils/
│           └── escape.ts        # HTMLエスケープ
│
├── lib/
│   └── parsers/
│       ├── index.ts             # パーサーインターフェース
│       └── gemini.ts            # Gemini DOM解析
│
├── utils/
│   └── platform.ts              # プラットフォーム判定
│
├── public/
│   └── icon/                    # 拡張機能アイコン
│
├── wxt.config.ts                # WXT設定
└── package.json
```

## 公開インターフェース

### Content Script メッセージ

```typescript
// リクエスト
interface CaptureMessage {
  type: 'CAPTURE_CONVERSATION';
}

// レスポンス
interface CaptureResponse {
  success: boolean;
  platform: SourcePlatform | null;
  data?: ParseResult;
  error?: string;
}
```

### パーサーインターフェース

```typescript
// lib/parsers/index.ts
interface ConversationParser {
  parse(): ParseResult;
}

type ParseResult =
  | { success: true; messages: Message[]; title: string | null }
  | { success: false; error: string };
```

## 依存関係図

```mermaid
graph TD
    subgraph "Entrypoints"
        CS[content.ts]
        BG[background.ts]
        PU[popup/main.ts]
    end

    subgraph "Popup Components"
        FM[form.ts]
        LD[loading.ts]
        TG[tags.ts]
    end

    subgraph "Parsers"
        PI[parsers/index.ts]
        GP[parsers/gemini.ts]
    end

    subgraph "Utils"
        PL[platform.ts]
        ES[escape.ts]
    end

    subgraph "External"
        SH[packages/shared]
        API[Web API]
        DOM[Gemini DOM]
    end

    CS --> PI
    CS --> PL
    PI --> GP
    GP --> DOM

    PU --> FM
    PU --> LD
    FM --> TG
    FM --> ES
    PU --> API
    PU --> SH

    CS -.-> BG
    BG -.-> PU
```

## 主要な処理フロー

### 対話キャプチャ

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant E as 拡張機能アイコン
    participant PU as Popup UI
    participant CS as Content Script
    participant GP as Gemini Parser
    participant DOM as Gemini DOM

    U->>E: クリック
    E->>PU: ポップアップ表示
    PU->>PU: init()
    PU->>CS: sendMessage(CAPTURE_CONVERSATION)
    CS->>CS: detectPlatform(url)
    CS->>GP: extractConversation('gemini')
    GP->>DOM: querySelectorAll()
    DOM-->>GP: Elements
    GP->>GP: parseGeminiConversation()
    GP-->>CS: ParseResult
    CS-->>PU: CaptureResponse
    alt 成功
        PU->>PU: initializeForm(data)
        PU-->>U: フォーム表示
    else 失敗
        PU->>PU: showError()
        PU-->>U: エラー表示
    end
```

### 対話保存

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant PU as Popup UI
    participant FM as FormManager
    participant API as Web API

    U->>PU: 保存ボタンをクリック
    PU->>FM: validate()
    alt バリデーション失敗
        FM-->>PU: { valid: false, error }
        PU-->>U: alert(error)
    else バリデーション成功
        FM-->>PU: { valid: true }
        PU->>FM: toSaveRequest()
        FM-->>PU: SaveConversationRequest
        PU->>PU: showLoading('保存中...')
        PU->>API: POST /api/conversations
        alt 成功
            API-->>PU: { success: true, data: { id } }
            PU->>PU: updateLoadingMessage('保存しました！')
            PU->>PU: setTimeout(window.close, 1000)
        else 失敗
            API-->>PU: { success: false, error }
            PU->>PU: hideLoading()
            PU-->>U: alert(error.message)
        end
    end
```

## DOM解析セレクタ

### Gemini（gemini.ts）

```typescript
const GEMINI_SELECTORS = {
  conversationTurn: 'model-response, user-query',
  userQuery: 'user-query',
  modelResponse: 'model-response',
  messageContent: '.message-content, .response-content, [class*="text"]',
  pageTitle: 'title',
} as const;
```

**更新方法**: DOM構造が変更された場合、このオブジェクトのみを更新。
パーサーロジックは変更不要（OCP準拠）。

### プラットフォーム判定（platform.ts）

```typescript
const PLATFORM_URL_PATTERNS = [
  { platform: 'gemini', hostPatterns: [/^gemini\.google\.com$/] },
  { platform: 'chatgpt', hostPatterns: [/^chat\.openai\.com$/, /^chatgpt\.com$/] },
  { platform: 'claude', hostPatterns: [/^claude\.ai$/] },
] as const;
```

## 設計意図

### WXTの採用理由

- Manifest V3対応のデファクトスタンダード
- HMR（Hot Module Replacement）による高速開発
- TypeScriptネイティブサポート

### パーサーの抽象化

- `ConversationParser` インターフェースで統一
- プラットフォーム追加時に新規パーサーを追加するだけ
- 既存コード変更不要（OCP準拠）

### セキュリティ対策

- `escapeHtml()` でXSS対策
- `host_permissions` で許可ドメインを制限
- API Keyは拡張機能に含めない（サーバーサイドのみ）

## 実装状況

| プラットフォーム | 状態 | パーサー |
|-----------------|------|---------|
| Gemini | ✅ 実装済み | `gemini.ts` |
| ChatGPT | 🔲 計画中 | スタブ実装 |
| Claude | 🔲 計画中 | スタブ実装 |

## 次に読むべきドキュメント

- Webアプリケーション → [web.md](web.md)
- 共通型定義 → [shared.md](shared.md)
- API仕様 → [../api.md](../api.md)
