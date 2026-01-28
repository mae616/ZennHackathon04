# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**ZennHackathon04 - 思考再開AIエージェント**

LLM対話（ChatGPT/Claude/Gemini）から「重要なやり取り」をキャプチャし、後から思考を再開できるAIエージェント。

## 技術スタック

| 領域 | 技術 |
|------|------|
| モノレポ | pnpm workspaces |
| Web | Next.js 15 App Router + React 19 |
| 拡張機能 | WXT (Manifest V3) |
| 共通型定義 | Zod |
| スタイル | Tailwind CSS v4 |
| AI | Vertex AI (Gemini) |
| DB | Firestore |
| ランタイム | Node.js 20+ |

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

# 拡張機能をChromeで読み込み
# 1. pnpm --filter @zenn-hackathon04/extension build
# 2. chrome://extensions → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」
# 3. apps/extension/.output/chrome-mv3 を選択
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

- `ConversationSchema`: 対話セッション（title, source, messages[], tags, note）
- `MessageSchema`: メッセージ（role: user/assistant/system, content）
- `ApiSuccessSchema<T>` / `ApiErrorSchema`: API レスポンス型

インポート例:
```typescript
import { ConversationSchema, type Conversation } from '@zenn-hackathon04/shared';
```

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
- **Extension**: WXT自動生成（`.wxt/tsconfig.json`）

## プロジェクト固有の制約

- **対話ソース**: ChatGPT / Claude / Gemini のDOM構造に依存（変更時は要追従）
- **表示環境**: デスクトップ 1440x900、拡張機能ポップアップ 400x600
- **非目標**: マルチユーザー対応、Firefox拡張、モバイルアプリ

## 参照優先順位（SSOT）

1. `CLAUDE.md`（このファイル + グローバル）
2. `doc/input/rdd.md`（要件定義・事実・制約）
3. `.claude/skills/*/SKILL.md`（判断軸スキル）
4. `doc/guide/ai_guidelines.md`（詳細運用）
