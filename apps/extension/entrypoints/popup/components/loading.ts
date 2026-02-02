/**
 * @fileoverview ローディング表示コンポーネント
 *
 * 対話キャプチャ中や保存処理中のローディング状態を表示する。
 * オーバーレイ形式で表示し、処理中であることをユーザーに伝える。
 */

import { escapeHtml } from '../utils/escape';

/**
 * ローディングオーバーレイを作成する
 *
 * @param message - 表示するローディングメッセージ
 * @returns ローディングオーバーレイのHTML要素
 *
 * @example
 * ```typescript
 * const loading = createLoadingOverlay('対話を取得中...');
 * document.body.appendChild(loading);
 * ```
 */
export function createLoadingOverlay(message: string): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.id = 'loading-overlay';

  overlay.innerHTML = `
    <div class="loading-spinner"></div>
    <p class="loading-text">${escapeHtml(message)}</p>
  `;

  return overlay;
}

/**
 * ローディングオーバーレイを表示する
 *
 * @param message - 表示するローディングメッセージ
 */
export function showLoading(message: string): void {
  // 既存のローディングがあれば削除
  hideLoading();

  const overlay = createLoadingOverlay(message);
  document.body.appendChild(overlay);
}

/**
 * ローディングオーバーレイを非表示にする
 */
export function hideLoading(): void {
  const existing = document.getElementById('loading-overlay');
  if (existing) {
    existing.remove();
  }
}

/**
 * ローディングメッセージを更新する
 *
 * @param message - 新しいメッセージ
 */
export function updateLoadingMessage(message: string): void {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    const textElement = overlay.querySelector('.loading-text');
    if (textElement) {
      textElement.textContent = message;
    }
  }
}
