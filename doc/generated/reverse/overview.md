# システム概要

## 背景（Background）

LLMとの対話は使い捨てになりがちで、重要な洞察や議論を保存・再利用できない課題がある。
エンジニア、リサーチャー、LLMヘビーユーザーにとって、価値ある対話を資産化し、
後から思考を継続できる仕組みが求められている。

## 目標（Goals）

1. **対話キャプチャ**: ChatGPT/Claude/GeminiのDOM構造から対話を取得
2. **対話保存**: Chrome拡張からFirestoreに対話を永続化
3. **対話閲覧**: Web管理画面で保存済み対話を一覧・詳細表示
4. **思考再開**: 保存した対話をGeminiに渡して思考を継続（Sprint 2予定）

## 非目標（Non-Goals）

- マルチユーザー対応
- 高度な検索・フィルタ機能
- モバイルアプリ
- Firefox拡張

## システム構成図

```mermaid
C4Context
    title ThinkResume システムコンテキスト図

    Person(user, "ユーザー", "エンジニア/リサーチャー")

    System_Boundary(thinkresume, "ThinkResume") {
        Container(extension, "Chrome拡張", "WXT/Manifest V3", "対話キャプチャ")
        Container(web, "Webアプリ", "Next.js 15", "管理画面 + API")
        ContainerDb(firestore, "Firestore", "NoSQL", "対話データ永続化")
    }

    System_Ext(gemini_web, "Gemini Web", "gemini.google.com")
    System_Ext(vertex, "Vertex AI", "Gemini API")

    Rel(user, extension, "対話をキャプチャ")
    Rel(user, web, "対話を閲覧・管理")
    Rel(extension, gemini_web, "DOM解析")
    Rel(extension, web, "POST /api/conversations")
    Rel(web, firestore, "読み書き")
    Rel(web, vertex, "思考再開（予定）")
```

## データフロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant E as Chrome拡張
    participant G as Gemini Web
    participant A as Web API
    participant F as Firestore
    participant W as Web UI

    U->>G: LLMと対話
    U->>E: 拡張機能アイコンをクリック
    E->>G: DOM解析（Content Script）
    G-->>E: Message[]
    E->>E: ポップアップUI表示
    U->>E: タイトル・メモ・タグを編集
    U->>E: 保存ボタンをクリック
    E->>A: POST /api/conversations
    A->>F: ドキュメント作成
    F-->>A: Document ID
    A-->>E: { success: true, data: { id } }

    U->>W: 管理画面にアクセス
    W->>A: GET /api/conversations
    A->>F: クエリ実行
    F-->>A: Document[]
    A-->>W: { conversations[] }
    W-->>U: 対話一覧表示
```

## 主要な技術スタック

| 領域 | 技術 | バージョン |
|------|------|-----------|
| モノレポ | pnpm workspaces | 9+ |
| Web | Next.js App Router | 15 |
| 拡張機能 | WXT (Manifest V3) | 0.20+ |
| 共通型定義 | Zod | 3.24+ |
| スタイル | Tailwind CSS | v4 |
| DB | Firestore | - |
| AI | Vertex AI (Gemini) | - |
| ランタイム | Node.js | 20+ |

## 次に読むべきドキュメント

- 設計判断の詳細 → [architecture.md](architecture.md)
- データ構造 → [database.md](database.md)
- APIインターフェース → [api.md](api.md)
