# ZennHackathon04 - 思考再開AIエージェント

LLM対話から「重要なやり取り」を選び、思考を再開するAIエージェント

## 概要

- **課題**: LLMとの対話は使い捨てになりがち。重要な洞察や議論を保存・再利用できない
- **解決**: 対話をブックマークし、後日Geminiで思考を再開できる

## 構成

```
ZennHackathon04/
├── apps/
│   ├── web/        # Next.js 15 App Router（管理画面 + API）
│   └── extension/  # Chrome Extension（WXT）
├── packages/
│   └── shared/     # 共通型定義（Zod）
└── doc/            # ドキュメント
```

## 技術スタック

| 領域 | 技術 |
|------|------|
| モノレポ | pnpm workspaces |
| Web | Next.js 15 (App Router) |
| Extension | WXT (Manifest V3) |
| 共通 | TypeScript, Zod |
| AI | Vertex AI (Gemini) |
| DB | Firestore |

## セットアップ

```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動（web + extension 同時）
pnpm dev

# ビルド
pnpm build
```

## 開発

```bash
# Webのみ起動
pnpm --filter @zenn-hackathon04/web dev

# Extensionのみ起動
pnpm --filter @zenn-hackathon04/extension dev
```

## Chrome拡張のロード

1. `pnpm --filter @zenn-hackathon04/extension build`
2. Chrome → `chrome://extensions/` → 「デベロッパーモード」ON
3. 「パッケージ化されていない拡張機能を読み込む」
4. `apps/extension/.output/chrome-mv3` を選択

## ドキュメント

- [要件定義書](./doc/input/rdd.md)
- [ガイドライン](./doc/guide/)

## ライセンス

MIT
