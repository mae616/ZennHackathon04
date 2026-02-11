# ThinkResume — LLMとの対話を、資産に変える

<p align="center">
  <img src="apps/extension/public/icon/128.png" alt="ThinkResume Logo" width="80" />
</p>

<p align="center">
  <strong>思考再開AIエージェント</strong><br/>
  ChatGPT・Claude・Gemini との対話を保存し、Gemini で思考を再開できるツール
</p>

---

## どんなプロダクト？

LLMとの対話は「使い捨て」になりがちです。
重要な議論や洞察があっても、ブラウザを閉じれば流れてしまいます。

**ThinkResume** は、Chrome拡張でLLM対話をワンクリック保存し、後から **Gemini で思考を再開** できるAIエージェントです。

### 主な機能

| 機能 | 説明 |
|------|------|
| **対話キャプチャ** | Chrome拡張でGeminiの対話をワンクリック保存。タイトル・メモ・タグをAIが自動生成 |
| **思考再開** | 保存した対話のコンテキストを引き継ぎ、Geminiと続きの議論ができる |
| **洞察保存** | Geminiとの対話から重要なQ&Aを「洞察」として蓄積 |
| **スペース** | 複数の対話をグループ化し、統合コンテキストで横断的に思考を継続 |
| **メモ・追記** | 保存した対話にメモを追記し、思考のコンテキストを補強 |
| **タグ・検索** | タグとキーワードで保存した対話を整理・検索 |

---

## スクリーンショット

### Web管理画面

| 対話一覧 | 思考再開 |
|----------|----------|
| ![対話一覧](doc/images/web-conversations.png) | ![思考再開](doc/images/web-think-resume.png) |

| スペース一覧 |
|-------------|
| ![スペース一覧](doc/images/web-spaces.png) |

### Chrome拡張（ポップアップ）

<!-- TODO: 実際のスクリーンショットに差し替え -->
![拡張機能ポップアップ](doc/images/extension-popup.png)

対話ページで拡張アイコンをクリックすると、AIがタイトル・メモ・タグを自動生成。確認・編集して保存できます。

---

## アーキテクチャ

```
Chrome拡張（DOM解析）
    ↓ ワンクリック保存
  Popup UI（AI自動生成 → 確認・編集）
    ↓ API呼び出し
  Next.js API Routes
    ↓ 保存 / 取得
  Firestore（対話・スペース・洞察）
    ↓ コンテキスト注入
  Vertex AI (Gemini)  ← 思考再開・ストリーミング応答
    ↓
  Web UI（チャット・洞察保存）
```

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| モノレポ | pnpm workspaces |
| Web | Next.js 16 (App Router) |
| Chrome拡張 | WXT (Manifest V3) |
| 共通スキーマ | TypeScript + Zod |
| AI | Vertex AI (Gemini) |
| DB | Firestore |
| スタイル | Tailwind CSS v4 |
| インフラ | Google Cloud Run |

---

## 審査員向け：Chrome拡張のセットアップ

### 前提条件

- **Node.js** 20以上
- **pnpm** 9以上
- **Google Chrome** 最新版

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/mae616/ZennHackathon04.git
cd ZennHackathon04

# 2. 依存関係をインストール
pnpm install

# 3. Chrome拡張をビルド（デモ環境に接続する場合）
VITE_API_BASE_URL=<デモURL> pnpm --filter @zenn-hackathon04/extension build
```

> **デモURL** は別途提出資料に記載しています。

#### Chromeに拡張機能を読み込む

1. Chrome で `chrome://extensions/` を開く
2. 右上の **「デベロッパーモード」** を **ON** にする
3. **「パッケージ化されていない拡張機能を読み込む」** をクリック
4. `apps/extension/.output/chrome-mv3` フォルダを選択

#### 使い方

1. [Google Gemini](https://gemini.google.com/) で対話する
2. 保存したい対話のページで、ツールバーの **ThinkResume アイコン** をクリック
3. タイトル・メモ・タグを確認し、必要に応じて編集
4. **「保存する」** をクリック → デモ環境に保存され、Web画面で確認できます

> **補足**: 拡張機能のポップアップ（DOM解析・フォーム表示）はバックエンドなしで動作します。
> 「保存する」ボタンを押す際にのみ Web API への接続が必要です。

---

## ローカル開発

### 環境変数の設定

`.env.local` をプロジェクトルートの `apps/web/` に作成：

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 開発サーバー

```bash
# Web + Extension 同時起動
pnpm dev

# 個別起動
pnpm --filter @zenn-hackathon04/web dev       # Web: http://localhost:3000
pnpm --filter @zenn-hackathon04/extension dev  # Extension: HMR対応
```

### ビルド・チェック

```bash
pnpm build                                           # 全体ビルド
pnpm lint                                            # Lint
pnpm --filter @zenn-hackathon04/web exec tsc --noEmit # 型チェック（Web）
pnpm --filter @zenn-hackathon04/shared lint           # 型チェック（shared）
```

---

## プロジェクト構成

```
ZennHackathon04/
├── apps/
│   ├── web/              # Next.js 16 App Router（管理画面 + API）
│   │   └── src/app/      # App Router ルート
│   └── extension/        # Chrome拡張（WXT / Manifest V3）
│       └── entrypoints/  # content.ts, background.ts, popup/
├── packages/
│   └── shared/           # 共通型定義（Zod スキーマ）
└── doc/                  # ドキュメント・デザイン
```

---

## 開発について

### AI駆動開発

本プロジェクトは **Claude Code** を活用したAI駆動開発で構築しました。

- 要件定義（RDD）→ デザイン → 実装 → レビュー → デプロイまで、AIとの対話を通じて段階的に開発
- スキルシステムによるプロンプト管理で、品質と一貫性を維持
- まさに **「LLMとの対話を資産にする」** というプロダクトのコンセプトを、開発プロセス自体で体現

### スプリント構成

| Sprint | 内容 |
|--------|------|
| Sprint 1 | 対話キャプチャ（拡張機能）+ 保存API + 一覧・詳細UI |
| Sprint 2 | 思考再開（Geminiチャット）+ 洞察保存 + メモ編集 |
| Sprint 3 | スペース機能 + タグ・検索 + Cloud Runデプロイ |

---

## ライセンス

MIT
