# GCP Cloud Run デプロイ手順

最終更新: 2026-02-11 / 対象: apps/web (Next.js 16) / 想定読者: 開発者

## 変更履歴

- 2026-02-11: 初版作成（Sprint 3 完了時点のデプロイ手順）

---

## 1. 概要

- **目的**: Next.js 16 App Router アプリ（ThinkResume Web）を GCP Cloud Run にデプロイする
- **成果物**: `https://<SERVICE_NAME>-<HASH>.run.app` でアクセス可能な Web アプリケーション
- **失敗時の影響**: Web UI が利用不可（拡張機能のキャプチャ機能には影響なし、API保存先が不通になる）
- **参照**: `doc/input/rdd.md` §制約（GCP統一: Cloud Run + Firestore + Vertex AI）

---

## 2. 前提条件

### 必要ツール

| ツール | バージョン | 確認コマンド |
|--------|-----------|-------------|
| Node.js | >= 20.0.0 | `node -v` |
| pnpm | >= 9.0.0 | `pnpm -v` |
| Docker | 最新安定版 | `docker -v` |
| gcloud CLI | 最新安定版 | `gcloud version` |

### GCP 権限

- Cloud Run 管理者（`roles/run.admin`）
- Artifact Registry 書き込み（`roles/artifactregistry.writer`）
- サービスアカウント ユーザー（`roles/iam.serviceAccountUser`）

### GCP リソース（事前に作成済みであること）

- GCP プロジェクト
- Firestore データベース（Native モード）
- Vertex AI API 有効化済み
- Firebase Admin SDK 用サービスアカウント + 秘密鍵 JSON

---

## 3. 詳細手順

### [S-01] next.config.ts に standalone 出力を設定

- **目的**: Docker 向けに最小限のファイルのみ含む standalone ビルドを有効化する
- **実行**:

  `apps/web/next.config.ts` を以下のように編集:

  ```typescript
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    output: "standalone",
  };

  export default nextConfig;
  ```

- **検証**:
  ```bash
  cat apps/web/next.config.ts
  ```
  期待結果: `output: "standalone"` が含まれている

- **ロールバック**:
  ```bash
  git checkout apps/web/next.config.ts
  ```

---

### [S-02] Dockerfile を作成

- **目的**: pnpm workspaces モノレポに対応した多段ビルド Dockerfile を作成する
- **実行**:

  プロジェクトルートに `Dockerfile` を作成:

  ```dockerfile
  # ============================================
  # Stage 1: 依存解決
  # ============================================
  FROM node:20-slim AS deps
  RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
  WORKDIR /app

  # pnpm 関連ファイルをコピー
  COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
  COPY apps/web/package.json apps/web/
  COPY packages/shared/package.json packages/shared/

  # 依存インストール（devDependencies 含む: ビルドに必要）
  RUN pnpm install --frozen-lockfile

  # ============================================
  # Stage 2: ビルド
  # ============================================
  FROM node:20-slim AS builder
  RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
  WORKDIR /app

  COPY --from=deps /app/node_modules ./node_modules
  COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
  COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

  # ソースコードをコピー
  COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
  COPY apps/web/ apps/web/
  COPY packages/shared/ packages/shared/

  # shared パッケージをビルド（web が依存）
  RUN pnpm --filter @zenn-hackathon04/shared run build

  # Next.js ビルド
  RUN pnpm --filter @zenn-hackathon04/web run build

  # ============================================
  # Stage 3: ランタイム（最小イメージ）
  # ============================================
  FROM node:20-slim AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  ENV PORT=8080

  # セキュリティ: 非 root ユーザーで実行
  RUN addgroup --system --gid 1001 nodejs && \
      adduser --system --uid 1001 nextjs

  # standalone 出力をコピー
  COPY --from=builder /app/apps/web/.next/standalone ./
  COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
  COPY --from=builder /app/apps/web/public ./apps/web/public

  USER nextjs

  EXPOSE 8080

  # Next.js standalone サーバーを起動（Cloud Run は PORT=8080 を期待）
  CMD ["node", "apps/web/server.js"]
  ```

- **検証**:
  ```bash
  ls -la Dockerfile
  ```
  期待結果: ファイルが存在する

---

### [S-03] .dockerignore を作成

- **目的**: Docker ビルドコンテキストを最小化し、ビルド速度を向上させる
- **実行**:

  プロジェクトルートに `.dockerignore` を作成:

  ```
  node_modules
  .next
  .git
  .env*
  *.md
  doc/
  apps/extension/
  .claude/
  ```

- **検証**:
  ```bash
  ls -la .dockerignore
  ```

---

### [S-04] ローカルで Docker ビルドを検証

- **目的**: Cloud Run にデプロイする前にローカルでビルド成功を確認する
- **実行**:
  ```bash
  docker build -t thinkresume-web .
  ```

- **検証**:
  ```bash
  docker images | grep thinkresume-web
  ```
  期待結果: `thinkresume-web` イメージが表示される

- **ロールバック**:
  ```bash
  docker rmi thinkresume-web
  ```

- **注意**: Apple Silicon (ARM) Mac の場合、Cloud Run (amd64) 向けにクロスビルドする場合:
  ```bash
  docker build --platform linux/amd64 -t thinkresume-web .
  ```

---

### [S-05] ローカルで Docker コンテナを実行テスト

- **目的**: コンテナがポート 8080 で正常起動するか確認する
- **実行**:
  ```bash
  docker run --rm -p 8080:8080 \
    -e FIREBASE_PROJECT_ID=<YOUR_PROJECT_ID> \
    -e FIREBASE_CLIENT_EMAIL=<YOUR_CLIENT_EMAIL> \
    -e "FIREBASE_PRIVATE_KEY=<YOUR_PRIVATE_KEY>" \
    -e GCP_PROJECT_ID=<YOUR_PROJECT_ID> \
    thinkresume-web
  ```

- **検証**:
  ブラウザで `http://localhost:8080` を開き、対話一覧ページが表示されることを確認

- **ロールバック**:
  ```bash
  docker stop $(docker ps -q --filter ancestor=thinkresume-web)
  ```

---

### [S-06] gcloud CLI の認証とプロジェクト設定

- **目的**: gcloud CLI が正しいプロジェクトを指していることを確認する
- **実行**:
  ```bash
  gcloud auth login
  gcloud config set project <YOUR_GCP_PROJECT_ID>
  ```

- **検証**:
  ```bash
  gcloud config get-value project
  ```
  期待結果: 自分のプロジェクトIDが表示される

---

### [S-07] Artifact Registry リポジトリを作成（初回のみ）

- **目的**: Docker イメージを格納するリポジトリを作成する
- **実行**:
  ```bash
  gcloud artifacts repositories create thinkresume \
    --repository-format=docker \
    --location=asia-northeast1 \
    --description="ThinkResume Docker images"
  ```

- **検証**:
  ```bash
  gcloud artifacts repositories list --location=asia-northeast1
  ```
  期待結果: `thinkresume` リポジトリが表示される

- **注意**: 既にリポジトリがある場合はスキップ可

---

### [S-08] Docker イメージをビルド＆プッシュ

- **目的**: Cloud Run 用のイメージを Artifact Registry にプッシュする
- **実行**:
  ```bash
  # Docker 認証ヘルパーを設定（初回のみ）
  gcloud auth configure-docker asia-northeast1-docker.pkg.dev

  # イメージをビルド＆タグ付け＆プッシュ
  docker build --platform linux/amd64 -t asia-northeast1-docker.pkg.dev/<YOUR_PROJECT_ID>/thinkresume/web:latest .
  docker push asia-northeast1-docker.pkg.dev/<YOUR_PROJECT_ID>/thinkresume/web:latest
  ```

- **検証**:
  ```bash
  gcloud artifacts docker images list asia-northeast1-docker.pkg.dev/<YOUR_PROJECT_ID>/thinkresume/web
  ```
  期待結果: `latest` タグのイメージが表示される

- **代替（Cloud Build 利用）**: ローカル Docker なしでビルドする場合:
  ```bash
  gcloud builds submit --tag asia-northeast1-docker.pkg.dev/<YOUR_PROJECT_ID>/thinkresume/web:latest .
  ```

---

### [S-09] Cloud Run サービスをデプロイ

- **目的**: Artifact Registry のイメージを Cloud Run にデプロイする
- **実行**:
  ```bash
  gcloud run deploy thinkresume-web \
    --image=asia-northeast1-docker.pkg.dev/<YOUR_PROJECT_ID>/thinkresume/web:latest \
    --region=asia-northeast1 \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --set-env-vars="FIREBASE_PROJECT_ID=<YOUR_PROJECT_ID>" \
    --set-env-vars="FIREBASE_CLIENT_EMAIL=<YOUR_CLIENT_EMAIL>" \
    --set-env-vars="GCP_PROJECT_ID=<YOUR_PROJECT_ID>" \
    --set-env-vars="NODE_ENV=production" \
    --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest"
  ```

- **検証**:
  ```bash
  gcloud run services describe thinkresume-web --region=asia-northeast1 --format="value(status.url)"
  ```
  期待結果: `https://thinkresume-web-XXXXX.run.app` のような URL が表示される

- **ロールバック**（前バージョンに戻す場合）:
  ```bash
  gcloud run services update-traffic thinkresume-web \
    --region=asia-northeast1 \
    --to-revisions=<PREVIOUS_REVISION>=100
  ```

- **注意**: `FIREBASE_PRIVATE_KEY` はSecret Manager を使用するのが推奨。
  Secret Manager を使わない場合は `--set-env-vars` で直接指定も可能だが非推奨:
  ```bash
  --set-env-vars="FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n..."
  ```

---

### [S-10] Secret Manager に FIREBASE_PRIVATE_KEY を登録（推奨）

- **目的**: 秘密鍵を安全に管理する（[S-09] で `--update-secrets` を使う場合の前提）
- **実行**:
  ```bash
  # シークレットを作成
  echo -n '<YOUR_FIREBASE_PRIVATE_KEY>' | \
    gcloud secrets create firebase-private-key --data-file=-

  # Cloud Run サービスアカウントにアクセス権を付与
  gcloud secrets add-iam-policy-binding firebase-private-key \
    --member="serviceAccount:<PROJECT_NUMBER>-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
  ```

- **検証**:
  ```bash
  gcloud secrets versions list firebase-private-key
  ```
  期待結果: バージョンが 1 つ以上表示される

- **注意**: `<PROJECT_NUMBER>` は GCP コンソールのプロジェクト情報から確認

---

### [S-11] API_URL 環境変数を設定

- **目的**: Server Components が自身の API を呼び出す際のベース URL を設定する
- **実行**:

  デプロイ後の URL を取得してから:
  ```bash
  SERVICE_URL=$(gcloud run services describe thinkresume-web --region=asia-northeast1 --format="value(status.url)")

  gcloud run services update thinkresume-web \
    --region=asia-northeast1 \
    --set-env-vars="API_URL=${SERVICE_URL}"
  ```

- **検証**:
  ```bash
  gcloud run services describe thinkresume-web --region=asia-northeast1 --format="yaml(spec.template.spec.containers[0].env)"
  ```
  期待結果: `API_URL` が Cloud Run の URL に設定されている

- **注意**: 初回デプロイ時は URL が未確定のため、デプロイ後に設定が必要。
  2回目以降は URL が変わらないため不要。

---

## 4. 確認方法（総合）

### ヘルスチェック

```bash
SERVICE_URL=$(gcloud run services describe thinkresume-web --region=asia-northeast1 --format="value(status.url)")

# トップページ
curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/"
# 期待: 200

# API エンドポイント
curl -s "${SERVICE_URL}/api/conversations" | head -c 200
# 期待: {"success":true,"data":{"conversations":[...]}}
```

### ブラウザ確認

1. `${SERVICE_URL}/` — 対話一覧ページが表示される
2. `${SERVICE_URL}/spaces` — スペース一覧ページが表示される

### ログ確認

```bash
gcloud run services logs read thinkresume-web --region=asia-northeast1 --limit=20
```

---

## 5. トラブルシューティング

### [TS-01] Docker ビルドで `pnpm install` が失敗

- **原因**: `pnpm-lock.yaml` がコミットされていない、またはバージョン不一致
- **対処**:
  ```bash
  pnpm install  # lockfile を再生成
  git add pnpm-lock.yaml
  ```

### [TS-02] Cloud Run で「Container failed to start」

- **原因**: 環境変数の不足、または PORT 不一致
- **対処**:
  1. ログを確認: `gcloud run services logs read thinkresume-web --region=asia-northeast1`
  2. 環境変数を確認: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GCP_PROJECT_ID` が設定されているか
  3. ローカルで `docker run -p 8080:8080 ...` で起動テスト

### [TS-03] 「FIREBASE_PRIVATE_KEY の改行が正しくない」

- **原因**: Secret Manager 経由で渡した値の改行エスケープ問題
- **対処**: 秘密鍵の `\n` が実際の改行になっているか確認。
  コード側で `privateKey.replace(/\\n/g, '\n')` で変換済みだが、
  Secret Manager に格納する際は **実際の改行** で保存すること。

### [TS-04] Vertex AI API が 403 Permission Denied

- **原因**: Cloud Run のサービスアカウントに Vertex AI 権限がない
- **対処**:
  ```bash
  gcloud projects add-iam-policy-binding <YOUR_PROJECT_ID> \
    --member="serviceAccount:<PROJECT_NUMBER>-compute@developer.gserviceaccount.com" \
    --role="roles/aiplatform.user"
  ```

### [TS-05] standalone ビルドで `Module not found`

- **原因**: `next.config.ts` に `output: "standalone"` が設定されていない
- **対処**: [S-01] を確認

### [TS-06] Apple Silicon Mac でビルドしたイメージが Cloud Run で動かない

- **原因**: ARM イメージを amd64 環境で実行しようとしている
- **対処**: `--platform linux/amd64` を付けてビルドする（[S-04] 注意参照）

---

## 6. 完了後の効果

- Web アプリケーションがインターネット経由でアクセス可能
- Chrome 拡張機能からの API 呼び出し先を Cloud Run URL に変更可能
- Firestore + Vertex AI との連携がプロダクション環境で動作

---

## 7. 付録

### 環境変数一覧

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|----|
| `FIREBASE_PROJECT_ID` | Yes | Firebase プロジェクトID | `my-project-12345` |
| `FIREBASE_CLIENT_EMAIL` | Yes | サービスアカウントメール | `firebase-adminsdk-xxx@project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Yes | サービスアカウント秘密鍵（PEM） | Secret Manager 推奨 |
| `GCP_PROJECT_ID` | Yes | GCP プロジェクトID（Vertex AI 用） | `my-project-12345` |
| `VERTEX_AI_LOCATION` | No | Vertex AI リージョン（デフォルト: `us-central1`） | `asia-northeast1` |
| `API_URL` | No | Server Components 用 API ベース URL | `https://thinkresume-web-xxx.run.app` |
| `NODE_ENV` | No | 実行環境（デフォルト: `production`） | `production` |
| `PORT` | No | リッスンポート（Cloud Run は 8080 固定） | `8080` |

### クイックデプロイコマンド（2回目以降）

```bash
# ビルド＆プッシュ＆デプロイを一括実行
docker build --platform linux/amd64 -t asia-northeast1-docker.pkg.dev/<YOUR_PROJECT_ID>/thinkresume/web:latest . && \
docker push asia-northeast1-docker.pkg.dev/<YOUR_PROJECT_ID>/thinkresume/web:latest && \
gcloud run deploy thinkresume-web \
  --image=asia-northeast1-docker.pkg.dev/<YOUR_PROJECT_ID>/thinkresume/web:latest \
  --region=asia-northeast1
```
