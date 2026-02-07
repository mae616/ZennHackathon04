/**
 * @fileoverview 未保存変更の離脱警告フック
 *
 * 編集中のページ離脱を防止するカスタムフック。
 * - ブラウザ離脱（タブ閉じ/リロード）: beforeunload イベント
 * - クライアントサイドナビゲーション（Next.js Link/router.push）: クリックイベント傍受
 *
 * Next.js App Router はルーターレベルのナビゲーションガードを提供しないため、
 * document上のクリックイベントを委任方式で監視し、<a>要素のクリックを傍受する。
 */
'use client';

import { useEffect } from 'react';

/**
 * 未保存変更がある場合にページ離脱を警告する
 *
 * @param isDirty - 未保存の変更があるかどうか
 */
export function useUnsavedChangesWarning(isDirty: boolean): void {
  // ブラウザ離脱（タブ閉じ/リロード）の警告
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // クライアントサイドナビゲーション（Link/router.push）の警告
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      // 外部リンクはbeforeunloadに任せる
      if (target.origin !== window.location.origin) return;

      // 同一ページ内アンカーは無視
      if (target.pathname === window.location.pathname) return;

      const confirmed = window.confirm(
        '編集内容が保存されていません。ページを離れますか？'
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // キャプチャフェーズで先に処理する（Next.jsのLinkハンドラより先）
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [isDirty]);
}
