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
 *
 * @remarks
 * Next.js App Router 環境を前提とする。
 * popstate ガードは history.pushState でダミーエントリを積む手法のため、
 * SPA 内のルーティングとブラウザの戻る/進む操作の両方に影響する。
 * confirmed 時の isPopstateHandlingRef リセットはコンポーネント unmount に依存している。
 */
export function useUnsavedChangesWarning(isDirty: boolean): void {
  /** popstate ハンドラ内で confirm 処理中かどうか（再入防止） */
  const isPopstateHandlingRef = useRef(false);

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

    // popstate 発火の流れ:
    // 1. ユーザーが戻るボタン押下 → ダミーエントリが消費されて popstate 発火
    // 2. handler 内で window.confirm 表示
    // 3-a. キャンセル → ダミーエントリを再度積んで現在のページに留まる
    // 3-b. confirmed → history.back() で本来の戻る先に遷移
    // 4. confirmed 時は isPopstateHandlingRef を true のまま維持する
    //    理由: history.back() は非同期で popstate を再発火するため、
    //    ここでリセットするとダイアログが二重表示される。
    //    コンポーネント unmount でクリーンアップされる。
    const handler = () => {
      if (isPopstateHandlingRef.current) return;
      isPopstateHandlingRef.current = true;

      const confirmed = window.confirm(
        '編集内容が保存されていません。ページを離れますか？'
      );
      if (!confirmed) {
        history.pushState({ [GUARD_STATE_KEY]: true }, '');
        isPopstateHandlingRef.current = false;
      } else {
        history.back();
      }
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
