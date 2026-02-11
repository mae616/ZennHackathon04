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
