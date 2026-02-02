# アーキテクチャ

## 設計方針

本プロジェクトは **SOLID原則** を基盤とする（`doc/input/architecture.md` より）:

- **SRP**: 各モジュールは単一責務（パーサー、API、UIコンポーネント分離）
- **OCP**: プラットフォーム追加時に既存パーサーを変更せず拡張可能
- **LSP**: `ConversationParser` インターフェースで代替可能性を保証
- **ISP**: 共通型を最小限に保ち、利用側に不要な依存を強要しない
- **DIP**: Firebase Admin SDK は `getDb()` 関数で抽象化

## コンポーネント図

```mermaid
graph TB
    subgraph "Chrome Extension"
        CS[Content Script]
        BG[Background Script]
        PU[Popup UI]

        subgraph "Parsers"
            GP[Gemini Parser]
            CP[ChatGPT Parser<br/>計画中]
            CLP[Claude Parser<br/>計画中]
        end
    end

    subgraph "Web Application"
        subgraph "API Routes"
            API_LIST[GET /api/conversations]
            API_SAVE[POST /api/conversations]
            API_GET[GET /api/conversations/:id]
        end

        subgraph "Pages"
            PAGE_LIST[対話一覧<br/>page.tsx]
            PAGE_DETAIL[対話詳細<br/>conversations/[id]/page.tsx]
        end

        subgraph "Components"
            CARD[ConversationCard]
            HEADER[ConversationHeader]
            MSG[MessageBubble]
        end

        subgraph "Lib"
            FB[Firebase Admin]
            ERR[Error Handler]
            DATE[Date Utils]
        end
    end

    subgraph "Shared Package"
        SCHEMA[Zod Schemas]
        TYPES[TypeScript Types]
    end

    subgraph "External"
        FS[(Firestore)]
        GEMINI[Gemini Web]
    end

    CS --> GP
    CS --> BG
    PU --> API_SAVE
    GP --> GEMINI

    API_SAVE --> FB
    API_LIST --> FB
    API_GET --> FB
    FB --> FS

    PAGE_LIST --> API_LIST
    PAGE_DETAIL --> API_GET
    PAGE_LIST --> CARD
    PAGE_DETAIL --> HEADER
    PAGE_DETAIL --> MSG

    API_SAVE --> SCHEMA
    API_LIST --> SCHEMA
    API_GET --> SCHEMA
    CS --> TYPES
    PU --> TYPES
```

## レイヤー構成

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ Chrome Extension │  │ Next.js Pages (App Router)     │  │
│  │ - Popup UI       │  │ - page.tsx (一覧)              │  │
│  │ - Content Script │  │ - conversations/[id]/page.tsx  │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ Parsers         │  │ API Routes                      │  │
│  │ - gemini.ts     │  │ - POST /api/conversations       │  │
│  │ - index.ts      │  │ - GET /api/conversations        │  │
│  └─────────────────┘  │ - GET /api/conversations/:id    │  │
│                       └─────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Domain Layer                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ packages/shared                                      │   │
│  │ - ConversationSchema, MessageSchema                 │   │
│  │ - ApiSuccessSchema, ApiFailureSchema               │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                     │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ Firebase Admin  │  │ WXT Runtime                     │  │
│  │ - admin.ts      │  │ - browser.runtime               │  │
│  │ - getDb()       │  │ - browser.tabs                  │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 設計判断（ADR-lite）

### ADR-001: モノレポ構成（pnpm workspaces）

- **決定**: pnpm workspaces でモノレポ構成を採用
- **理由**: Hackathon規模でシンプル、型共有が容易
- **代替案**: npm workspaces, Turborepo, Nx
- **トレードオフ**: 大規模化時にビルド最適化が必要になる可能性

### ADR-002: 共通スキーマの分離（packages/shared）

- **決定**: Zodスキーマを `packages/shared` に分離
- **理由**: 拡張機能↔Web API間の型安全性を保証、バリデーション統一
- **代替案**: 各アプリで個別に型定義
- **トレードオフ**: パッケージ依存が増えるが、型不整合リスクが大幅減少

### ADR-003: DOM解析セレクタの定数化

- **決定**: `GEMINI_SELECTORS` として定数化（`apps/extension/lib/parsers/gemini.ts`）
- **理由**: LLMサイトのDOM構造変更に迅速対応可能
- **代替案**: ハードコーディング
- **トレードオフ**: 抽象化コスト vs 保守性向上

### ADR-004: Firebase Admin SDK のサーバーサイド専用

- **決定**: Firebase Admin SDK はサーバーサイド（API Routes）でのみ使用
- **理由**: API Keyの露出防止、サービスアカウント認証による強固なセキュリティ
- **代替案**: クライアントサイドFirebase SDK
- **トレードオフ**: クライアント→サーバー→Firestoreの経路が増えるが、セキュリティ優先

### ADR-005: IDフォーマット検証の追加

- **決定**: `GET /api/conversations/:id` でFirestore Document ID制約を検証
- **理由**: 不正なIDによるエラー防止、Firestore制約の明示的チェック
- **代替案**: Firestoreに任せる
- **トレードオフ**: 検証コスト vs エラーメッセージの明確化

## 依存関係

### 外部サービス

| サービス | 用途 | 依存度 |
|---------|------|--------|
| Firestore | 対話データ永続化 | 高（コア機能） |
| Gemini Web | DOM解析対象 | 高（キャプチャ機能） |
| Vertex AI | 思考再開（予定） | 中（Sprint 2） |

### 主要ライブラリ

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| next | 16.x | Webアプリフレームワーク |
| react | 19.x | UIライブラリ |
| zod | 3.24+ | スキーマバリデーション |
| firebase-admin | 13.x | Firestore接続 |
| wxt | 0.20+ | Chrome拡張フレームワーク |
| lucide-react | - | アイコンライブラリ |
| tailwindcss | v4 | CSSフレームワーク |

## 次に読むべきドキュメント

- データ構造 → [database.md](database.md)
- APIインターフェース → [api.md](api.md)
- モジュール詳細 → [modules/](modules/)
