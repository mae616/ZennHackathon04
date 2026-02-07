import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  /** WXT dev serverのポート設定（Next.jsとの競合を回避） */
  dev: {
    server: {
      port: 3001,
    },
  },
  manifest: {
    /**
     * APIリクエスト用のホスト権限
     * - localhost: 開発環境（Next.jsのポート3000）
     * - https://*: 本番環境（Cloud Run等）
     */
    host_permissions: ['http://localhost:3000/*', 'https://*/*'],
  },
});
