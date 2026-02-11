/**
 * @fileoverview 新規スペース作成モーダル
 *
 * スペース一覧ページから「+ 新規スペース」ボタンで開くモーダル。
 * タイトル（必須）と説明文（任意）を入力してスペースを作成する。
 * 作成後は /spaces/:id にリダイレクトする。
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, LayoutGrid } from 'lucide-react';

interface CreateSpaceModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
}

/**
 * 新規スペース作成モーダル
 *
 * @param isOpen - モーダルの表示状態
 * @param onClose - モーダルを閉じるコールバック
 */
export function CreateSpaceModal({ isOpen, onClose }: CreateSpaceModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  /** フォームリセット */
  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setError(null);
  }, []);

  /** モーダルを閉じる */
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }, [isSubmitting, resetForm, onClose]);

  /** モーダル表示時にタイトル入力にフォーカス + ESCキーで閉じる + フォーカストラップ */
  useEffect(() => {
    if (!isOpen) return;

    // DOMが描画された後にフォーカスを当てる
    const timer = setTimeout(() => titleInputRef.current?.focus(), 100);

    // ESCキーでモーダルを閉じる
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleClose();
        return;
      }

      // フォーカストラップ: Tabキーでモーダル内にフォーカスを閉じ込める
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'input, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, handleClose]);

  /** スペースを作成する */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          ...(description.trim() && { description: description.trim() }),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'スペースの作成に失敗しました');
      }

      // 作成成功：詳細ページにリダイレクト
      resetForm();
      onClose();
      router.push(`/spaces/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スペースの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, resetForm, onClose, router]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="新規スペース作成"
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* モーダル本体 */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-lg p-6 shadow-lg"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid
              className="h-5 w-5"
              style={{ color: 'var(--red-primary)' }}
            />
            <h2
              className="text-lg font-semibold"
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                color: 'var(--black-primary)',
              }}
            >
              新規スペース
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-sm p-1 transition-opacity hover:opacity-70 disabled:opacity-50"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" style={{ color: 'var(--gray-500)' }} />
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div
            className="mb-4 rounded-sm px-3 py-2 text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--red-primary)',
            }}
          >
            {error}
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* タイトル（必須） */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="space-title"
              className="text-sm font-medium"
              style={{ color: 'var(--black-primary)' }}
            >
              タイトル <span style={{ color: 'var(--red-primary)' }}>*</span>
            </label>
            {/* NOTE: maxLength はUX補助のみ。実際の入力制約はサーバー側Zodバリデーションで担保 */}
            <input
              ref={titleInputRef}
              id="space-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: React設計パターン研究"
              maxLength={200}
              required
              disabled={isSubmitting}
              className="rounded-sm border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-red-500/40 disabled:opacity-50"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--black-primary)',
                backgroundColor: 'var(--bg-page)',
              }}
            />
          </div>

          {/* 説明文（任意） */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="space-description"
              className="text-sm font-medium"
              style={{ color: 'var(--black-primary)' }}
            >
              説明文
            </label>
            <textarea
              id="space-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="スペースの目的や関連するトピックを記述..."
              maxLength={1000}
              rows={3}
              disabled={isSubmitting}
              className="resize-none rounded-sm border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-red-500/40 disabled:opacity-50"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--black-primary)',
                backgroundColor: 'var(--bg-page)',
              }}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-sm px-4 py-2 text-sm transition-colors hover:opacity-80 disabled:opacity-50"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--gray-700)',
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 rounded-sm px-4 py-2 text-sm text-white transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: 'var(--red-primary)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                '作成'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
