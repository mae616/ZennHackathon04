# ThinkResume — LLM対話を資産に変え、思考を整理・継続するAIエージェント

<p align="center">
  <img src="apps/extension/public/icon/128.png" alt="ThinkResume Logo" width="80" />
</p>

<p align="center">
  <strong>「LLMとの対話を、資産に変える」</strong><br/>
  重要な対話を選び、構造化し、思考を継続できるAIエージェント
</p>

---

## どんなプロダクト？

LLM対話が日常になった今、ひとつの問題が浮かび上がっています。

> 対話の中で生まれた重要な断片や仮説を、思考素材として再利用する仕組みがない。

対話を「残す」方法はすでにあります。しかし、「残す」ことと「整理し、再利用する」ことは別の問題です。

**ThinkResume** は、LLMとの重要な対話を「保存して終わり」にせず、構造化することで、思考を再利用可能な形に変換するAIエージェントです。

### 設計思想：人が選び、AIが構造化する

何を保存するかは **人間が決め**、どう構造化するかは **AIが担う**。
「重要な部分を自分で整理する」という認知的負荷をAIに肩代わりさせる設計です。

### 主な機能

| 機能 | 説明 |
|------|------|
| **対話キャプチャ** | Chrome拡張でLLM対話をワンクリック保存。「この対話は重要」という人間の判断がトリガー |
| **思考再開** | 保存した対話・メモ・洞察を文脈として引き継ぎ、Geminiと思考を継続 |
| **洞察保存** | 思考再開の中で重要なやり取りをQ&A形式で蓄積し、知見を構造化 |
| **スペース** | 複数の対話をグループ化し、統合コンテキストで横断的に思考を深める |
| **メモ・追記** | 保存した対話にメモを追記し、思考のコンテキストを補強 |
| **タグ・検索** | タグとキーワードで保存した対話を整理・検索 |

### 現在の対応状況

| プラットフォーム | 対話キャプチャ（Chrome拡張） | 思考再開（Web） |
|-----------------|---------------------------|----------------|
| **Gemini** | **対応済み** | **対応済み** |
| ChatGPT | 未対応（計画中） | 保存済みデータの閲覧・思考再開は可能 |
| Claude | 未対応（計画中） | 保存済みデータの閲覧・思考再開は可能 |

> **Note**: Chrome拡張による対話キャプチャは現在 **Gemini のみ** に対応しています。ChatGPT・Claude の対話は、Gemini 経由で保存した後に Web 画面から閲覧・思考再開が可能です。

---

## スクリーンショット

### Chrome拡張（ポップアップ）

Gemini の対話ページで拡張アイコンをクリックすると、AIがタイトル・メモ・タグを自動生成。確認・編集して保存できる。

<p align="center">
  <img src="doc/images/extension-popup.png" alt="拡張機能ポップアップ" width="360" />
</p>

### 対話一覧

保存した対話をソース別バッジ（ChatGPT / Claude / Gemini）・タグ・メモ付きで一覧表示。キーワード検索・タグフィルタに対応。

![対話一覧](doc/images/web-conversations.png)

### 思考再開（対話詳細）

保存した対話履歴・メモ・洞察を確認しながら、右パネルの Gemini チャットで思考を再開。重要なやり取りは「洞察として保存」できる。

![思考再開](doc/images/web-think-resume.png)

### スペース一覧

関連する対話をグループ化した「スペース」を作成・管理。

![スペース一覧](doc/images/web-spaces.png)

### スペース詳細

スペース内の複数対話を統合コンテキストとして Gemini に渡し、横断的に思考を継続。

![スペース詳細](doc/images/web-space-detail.png)

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

> **補足**: 現時点でChrome拡張の対話キャプチャは **Gemini のみ** に対応しています。ChatGPT・Claude への対応は今後のアップデートで追加予定です。

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

### デモデータの投入

スクリーンショット・デモ向けのテストデータを投入できます（既存データは削除されます）：

```bash
NODE_PATH=apps/web/node_modules npx tsx scripts/seed-demo-data.ts
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
├── scripts/
│   └── seed-demo-data.ts # デモデータ投入スクリプト
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
