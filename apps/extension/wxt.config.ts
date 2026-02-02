import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    /**
     * APIリクエスト用のホスト権限
     * - localhost: 開発環境
     * - https://*: 本番環境（Cloud Run等）
     */
    host_permissions: ['http://localhost:3000/*', 'https://*/*'],
  },
});
