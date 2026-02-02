# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**ZennHackathon04 - 思考再開AIエージェント「ThinkResume」**

LLM対話（ChatGPT/Claude/Gemini）から「重要なやり取り」をキャプチャし、後から思考を再開できるAIエージェント。

**キャッチコピー**: 「LLMとの対話を、資産に変える」

## 技術スタック

| 領域 | 技術 |
|------|------|
| モノレポ | pnpm workspaces |
| Web | Next.js 16 App Router + React 19 |
| 拡張機能 | WXT 0.20+ (Manifest V3) |
| 共通型定義 | Zod 3.24+ |
| スタイル | Tailwind CSS v4 |
| AI | Vertex AI (Gemini) |
| DB | Firestore |
| ランタイム | Node.js 20+, pnpm 9+ |

## 開発コマンド

```bash
# 依存インストール
pnpm install

# 全体開発（web + extension同時起動）
pnpm dev

# 個別開発
pnpm --filter @zenn-hackathon04/web dev
pnpm --filter @zenn-hackathon04/extension dev

# ビルド
pnpm build

# Lint
pnpm lint

# TypeCheck（個別）
pnpm --filter @zenn-hackathon04/web exec tsc --noEmit
pnpm --filter @zenn-hackathon04/shared lint  # sharedはtsc --noEmit

# 拡張機能をChromeで読み込み
# 1. pnpm --filter @zenn-hackathon04/extension build
# 2. chrome://extensions → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」
# 3. apps/extension/.output/chrome-mv3 を選択
```

## 環境変数

`.env.local` に以下を設定（Firebase Admin SDK用）:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## アーキテクチャ

```
apps/
├── web/              # Next.js 15 App Router（管理画面 + API）
│   └── src/app/      # App Router ルート
└── extension/        # Chrome拡張（WXT）
    └── entrypoints/  # content.ts, background.ts, popup/

packages/
└── shared/           # 共通型定義（Zod スキーマ）
    └── src/types/    # conversation.ts, api.ts
```

**データフロー**:
拡張機能（DOM解析）→ Background（Storage API）→ Web API（Firestore保存）→ Web UI（一覧・詳細表示）→ Gemini（思考再開）

## 共通スキーマ（@zenn-hackathon04/shared）

**packages/shared/src/types/** に定義：

### conversation.ts
- `MessageRoleSchema`: `'user' | 'assistant' | 'system'`
- `MessageSchema`: id, role, content, timestamp
- `SourcePlatformSchema`: `'chatgpt' | 'claude' | 'gemini'`
- `ConversationStatusSchema`: `'active' | 'archived' | 'deleted'`
- `ConversationSchema`: id, title, source, messages[], status, tags, createdAt, updatedAt, note

### api.ts
- `ApiErrorSchema`: code, message, details
- `ApiSuccessSchema<T>` / `ApiFailureSchema`: APIレスポンス共通型
- `SaveConversationRequestSchema` / `ResponseSchema`: 保存API
- `ListConversationsResponseSchema`: 一覧API（conversations[], nextCursor?）

インポート例:
```typescript
import { ConversationSchema, type Conversation, type SourcePlatform } from '@zenn-hackathon04/shared';
```

## API Routes（Next.js App Router）

| エンドポイント | メソッド | 用途 |
|---------------|---------|------|
| `/api/conversations` | POST | 対話保存 |
| `/api/conversations` | GET | 対話一覧 |
| `/api/conversations/:id` | GET | 対話詳細 |

## Firestore スキーマ

- **Collection**: `conversations`
- **Document**: ConversationSchema に準拠

## Gitブランチ運用

| ブランチ | 用途 | CI |
|---------|------|-----|
| `main` | リリース可能安定版 | フルビルド + テスト |
| `sprint/xxx` | スプリント単位（1-3日） | フルビルド + テスト |
| `task/xxx` | 1タスク = 1 AI実装単位 | Lint + TypeCheck |
| `feature_fix/xxx` | スプリント統合後のバグ修正 | - |
| `hotfix/xxx` | 本番緊急修正 | - |

## パスエイリアス

- **Web**: `@/*` → `./src/*`
- **Extension**: WXT自動生成（`@`, `~`, `@@`, `~~` → ルート）

## 対話キャプチャ（Chrome拡張）

| プラットフォーム | マッチパターン | 状態 |
|-----------------|---------------|------|
| Gemini | `*://gemini.google.com/*` | 実装済み |
| ChatGPT | `*://chat.openai.com/*` | 計画中 |
| Claude | `*://claude.ai/*` | 計画中 |

**DOM解析セレクタ**: `apps/extension/lib/parsers/gemini.ts` の `GEMINI_SELECTORS` に定数化。DOM構造変更時はここを更新。

## デザイン・スタイル

- **フレームワーク**: Tailwind CSS v4
- **カラー**: 赤（$--red-primary）をアクセントカラー
- **トーン**: ライトモード基調、シンプル・ミニマル
- **デザインファイル**: `doc/input/design/thinkresume.pen`

## プロジェクト固有の制約

- **対話ソース**: ChatGPT / Claude / Gemini のDOM構造に依存（変更時は要追従）
- **表示環境**: デスクトップ 1440x900、拡張機能ポップアップ 400x600
- **非目標**: マルチユーザー対応、Firefox拡張、モバイルアプリ
- **環境変数**: `.env.local` でAPI Key管理（.gitignore対象）

## 参照優先順位（SSOT）

1. `CLAUDE.md`（このファイル + グローバル）
2. `doc/input/rdd.md`（要件定義・事実・制約）
3. `.claude/skills/*/SKILL.md`（判断軸スキル）
4. `doc/guide/ai_guidelines.md`（詳細運用）
