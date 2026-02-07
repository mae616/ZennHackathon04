/**
 * @fileoverview 未保存変更の離脱警告フック
 *
 * 編集中のページ離脱を防止するカスタムフック。
 * - ブラウザ離脱（タブ閉じ/リロード）: beforeunload イベント
 * - クライアントサイドナビゲーション（Next.js Link/router.push）: クリックイベント傍受
 * - ブラウザの戻る/進むボタン: popstate イベント + history.pushState で傍受
 *
 * Next.js App Router はルーターレベルのナビゲーションガードを提供しないため、
 * document上のクリックイベントを委任方式で監視し、<a>要素のクリックを傍受する。
 * また、ブラウザの戻る/進むボタンはダミーのhistoryエントリで検知する。
 */
'use client';

import { useEffect, useRef } from 'react';

/** popstate ガードで使用するダミー state のマーカー */
const GUARD_STATE_KEY = '__unsavedGuard';

/**
 * 未保存変更がある場合にページ離脱を警告する
 *
 * @param isDirty - 未保存の変更があるかどうか
 */
export function useUnsavedChangesWarning(isDirty: boolean): void {
  /** popstate ハンドラ内で confirm 処理中かどうか（再入防止） */
  const isHandlingRef = useRef(false);

  // ブラウザ離脱（タブ閉じ/リロード）の警告
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // クライアントサイドナビゲーション（Link クリック）の警告
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

  // ブラウザの戻る/進むボタンの警告
  useEffect(() => {
    if (!isDirty) return;

    // ダミーのhistoryエントリを積んで、戻るボタンを検知できるようにする
    history.pushState({ [GUARD_STATE_KEY]: true }, '');

    const handler = () => {
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      const confirmed = window.confirm(
        '編集内容が保存されていません。ページを離れますか？'
      );
      if (!confirmed) {
        // キャンセル: ダミーエントリを再度積んで現在のページに留まる
        history.pushState({ [GUARD_STATE_KEY]: true }, '');
      } else {
        // 確定: 本来の戻る操作を実行
        history.back();
      }

      isHandlingRef.current = false;
    };

    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      // cleanup: ダミーエントリが残っていたら除去
      if (history.state?.[GUARD_STATE_KEY]) {
        history.back();
      }
    };
  }, [isDirty]);
}
