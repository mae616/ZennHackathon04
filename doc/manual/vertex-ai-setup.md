# Vertex AI (Gemini) セットアップ手順書

最終更新: 2026-02-06 / 対象: GCP Vertex AI / 想定読者: 開発者

## 変更履歴
- 2026-02-06: 初版作成（Vertex AI連携基盤 PR #24 に対応）

---

## 1. 概要

- **目的**: ThinkResumeの思考再開機能で使用するVertex AI (Gemini) APIを有効化し、ローカル開発環境から利用可能にする
- **成果物**:
  - GCPプロジェクトでVertex AI APIが有効化
  - 認証設定が完了
  - `.env.local` に必要な環境変数が設定済み
- **失敗時の影響**: 思考再開機能（Geminiとの対話）が動作しない

---

## 2. 前提条件

### 必要なツール
| ツール | バージョン | 確認コマンド |
|--------|-----------|-------------|
| gcloud CLI | 最新推奨 | `gcloud --version` |
| Node.js | 20+ | `node -v` |
| pnpm | 9+ | `pnpm -v` |

### 必要な権限
- GCPプロジェクトのオーナーまたは編集者権限
- Vertex AI API の有効化権限
- サービスアカウントの作成権限（既存のFirebase SAを使う場合は不要）

### 参照
- `doc/input/rdd.md` §技術スタック: 「AI: Vertex AI (Gemini)」
- `apps/web/.env.local.example`: 環境変数テンプレート

---

## 3. 詳細手順

### [S-01] GCPプロジェクトの確認

- **目的**: Firebaseプロジェクトと同じGCPプロジェクトを使用することを確認
- **実行コマンド**:
  ```bash
  # 現在のプロジェクトを確認
  gcloud config get-value project

  # プロジェクト一覧を表示（必要に応じて）
  gcloud projects list

  # プロジェクトを切り替え（必要に応じて）
  gcloud config set project <YOUR_PROJECT_ID>
  ```
- **検証**:
  - 実行: `gcloud config get-value project`
  - 期待結果: Firebaseで使用しているプロジェクトIDが表示される
- **注意**: FirebaseプロジェクトIDと同じである必要がある（`FIREBASE_PROJECT_ID` と `GCP_PROJECT_ID` が一致）

---

### [S-02] Vertex AI API の有効化

- **目的**: GCPプロジェクトでVertex AI APIを利用可能にする
- **実行コマンド**:
  ```bash
  # Vertex AI API を有効化
  gcloud services enable aiplatform.googleapis.com
  ```
- **検証**:
  - 実行: `gcloud services list --enabled | grep aiplatform`
  - 期待結果: `aiplatform.googleapis.com` が表示される
- **ロールバック**:
  ```bash
  # API を無効化（必要に応じて）
  gcloud services disable aiplatform.googleapis.com
  ```
- **注意**: 有効化には数分かかる場合がある

---

### [S-03] 認証方式の選択

Vertex AI への認証は2つの方式から選択できる。

#### 方式A: Application Default Credentials（ADC）- ローカル開発推奨

- **目的**: 個人のGoogleアカウントでローカル開発時に認証
- **実行コマンド**:
  ```bash
  # ADC を設定（ブラウザが開く）
  gcloud auth application-default login

  # プロジェクトを明示的に設定
  gcloud auth application-default set-quota-project <YOUR_PROJECT_ID>
  ```
- **検証**:
  - 実行: `gcloud auth application-default print-access-token`
  - 期待結果: アクセストークンが表示される（エラーにならない）
- **注意**: ブラウザでGoogleアカウントにログインする必要がある

#### 方式B: サービスアカウント - 本番/CI環境推奨

- **目的**: サービスアカウントキーで認証（Firebase Admin SDKと同じSAを使用可能）
- **実行コマンド**:
  ```bash
  # 既存のFirebaseサービスアカウントにVertex AI権限を付与
  gcloud projects add-iam-policy-binding <YOUR_PROJECT_ID> \
    --member="serviceAccount:<FIREBASE_CLIENT_EMAIL>" \
    --role="roles/aiplatform.user"
  ```

  または、新規サービスアカウントを作成する場合:
  ```bash
  # 新規SA作成
  gcloud iam service-accounts create vertex-ai-sa \
    --display-name="Vertex AI Service Account"

  # 権限付与
  gcloud projects add-iam-policy-binding <YOUR_PROJECT_ID> \
    --member="serviceAccount:vertex-ai-sa@<YOUR_PROJECT_ID>.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

  # キーを作成
  gcloud iam service-accounts keys create ./vertex-ai-key.json \
    --iam-account=vertex-ai-sa@<YOUR_PROJECT_ID>.iam.gserviceaccount.com
  ```
- **検証**:
  - 実行: `gcloud projects get-iam-policy <YOUR_PROJECT_ID> | grep aiplatform`
  - 期待結果: `roles/aiplatform.user` が表示される
- **注意**:
  - キーファイル（`vertex-ai-key.json`）は `.gitignore` 対象であることを確認
  - Firebase Admin SDK用のSAを流用する場合、追加のキー作成は不要

---

### [S-04] 環境変数の設定

- **目的**: アプリケーションがVertex AIに接続できるよう環境変数を設定
- **実行コマンド**:
  ```bash
  # apps/web/.env.local を作成（既存の場合は追記）
  cd apps/web

  # テンプレートをコピー（初回のみ）
  cp .env.local.example .env.local

  # エディタで .env.local を開いて編集
  # 以下の変数を設定:
  # GCP_PROJECT_ID=<YOUR_PROJECT_ID>
  # VERTEX_AI_LOCATION=us-central1  # または asia-northeast1（日本リージョン）
  ```
- **設定する環境変数**:
  | 変数名 | 必須 | 説明 | 例 |
  |--------|------|------|-----|
  | `GCP_PROJECT_ID` | ○ | GCPプロジェクトID | `my-project-12345` |
  | `VERTEX_AI_LOCATION` | △ | リージョン（デフォルト: us-central1） | `asia-northeast1` |

- **検証**:
  - 実行: `grep GCP_PROJECT_ID apps/web/.env.local`
  - 期待結果: `GCP_PROJECT_ID=<YOUR_PROJECT_ID>` が表示される
- **注意**:
  - `.env.local` は `.gitignore` 対象。絶対にコミットしない
  - `FIREBASE_PROJECT_ID` と `GCP_PROJECT_ID` は同じ値になることが多い

---

### [S-05] 動作確認

- **目的**: Vertex AI APIが正しく呼び出せることを確認
- **実行コマンド**:
  ```bash
  # 開発サーバーを起動
  cd /path/to/ZennHackathon04
  pnpm dev

  # 別ターミナルで疎通確認（後続の #9 チャットUI実装後に実施）
  # 現時点では、ビルドが通ることを確認
  pnpm --filter @zenn-hackathon04/web build
  ```
- **検証**:
  - 実行: `pnpm --filter @zenn-hackathon04/web build`
  - 期待結果: ビルドが成功する（Vertex AI関連のimportエラーがない）
- **注意**: 実際のAPI呼び出しテストは #9（チャットUI）実装後に実施

---

## 4. 確認方法（総合）

### 設定確認チェックリスト

```bash
# 1. Vertex AI API が有効か
gcloud services list --enabled | grep aiplatform
# 期待: aiplatform.googleapis.com が表示

# 2. 認証が設定されているか（ADCの場合）
gcloud auth application-default print-access-token > /dev/null && echo "OK" || echo "NG"
# 期待: OK

# 3. 環境変数が設定されているか
grep -E "^GCP_PROJECT_ID=" apps/web/.env.local
# 期待: GCP_PROJECT_ID=<YOUR_PROJECT_ID>

# 4. ビルドが通るか
pnpm --filter @zenn-hackathon04/web build
# 期待: 成功
```

---

## 5. トラブルシューティング

### [TS-01] `PERMISSION_DENIED` エラー

- **症状**: `Vertex AI APIへのアクセスが拒否されました` というエラー
- **原因**: サービスアカウントまたはADCに `roles/aiplatform.user` 権限がない
- **対処**:
  ```bash
  # 権限を確認
  gcloud projects get-iam-policy <YOUR_PROJECT_ID> \
    --flatten="bindings[].members" \
    --filter="bindings.role:aiplatform"

  # 権限を付与
  gcloud projects add-iam-policy-binding <YOUR_PROJECT_ID> \
    --member="user:<YOUR_EMAIL>" \
    --role="roles/aiplatform.user"
  ```

### [TS-02] `NOT_FOUND` エラー

- **症状**: `Vertex AI APIが見つかりません` というエラー
- **原因**: Vertex AI APIが有効化されていない
- **対処**:
  ```bash
  gcloud services enable aiplatform.googleapis.com
  ```

### [TS-03] `RESOURCE_EXHAUSTED` エラー

- **症状**: `レート制限に達しました` というエラー
- **原因**: APIの呼び出し回数が上限に達した
- **対処**:
  - 数分待ってから再試行
  - GCPコンソールでクォータを確認・引き上げ申請

### [TS-04] ADC認証が動作しない

- **症状**: `Could not automatically determine credentials` というエラー
- **原因**: ADCが設定されていない、または期限切れ
- **対処**:
  ```bash
  # 再認証
  gcloud auth application-default login
  gcloud auth application-default set-quota-project <YOUR_PROJECT_ID>
  ```

### [TS-05] 環境変数が読み込まれない

- **症状**: `Vertex AI の初期化に必要な環境変数が設定されていません` というエラー
- **原因**: `.env.local` が正しい場所にない、または読み込まれていない
- **対処**:
  ```bash
  # ファイルの存在確認
  ls -la apps/web/.env.local

  # 内容確認
  grep GCP_PROJECT_ID apps/web/.env.local

  # 開発サーバーを再起動
  # Ctrl+C で停止後、再度 pnpm dev
  ```

---

## 6. 完了後の効果

- Vertex AI (Gemini) APIがローカル開発環境から呼び出し可能になる
- 思考再開機能（#9 チャットUI）の実装準備が整う
- Firebase Admin SDKと同じ認証基盤を共有し、管理が簡素化

---

## 7. 付録

### 環境変数一覧

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|-----|
| `GCP_PROJECT_ID` | ○ | GCPプロジェクトID | `my-project-12345` |
| `VERTEX_AI_LOCATION` | △ | Vertex AIリージョン | `us-central1`, `asia-northeast1` |

### リージョン選択の指針

| リージョン | レイテンシ（日本から） | 備考 |
|-----------|----------------------|------|
| `us-central1` | 高め（〜200ms） | デフォルト、モデル対応が早い |
| `asia-northeast1` | 低い（〜50ms） | 日本リージョン、レイテンシ重視の場合 |

### 参考リンク

- [Vertex AI 公式ドキュメント](https://cloud.google.com/vertex-ai/docs)
- [gcloud CLI リファレンス](https://cloud.google.com/sdk/gcloud/reference)
- [Gemini API on Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/gemini)
