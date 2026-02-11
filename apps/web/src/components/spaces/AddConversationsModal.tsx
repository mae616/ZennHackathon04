/**
 * @fileoverview 対話追加モーダル
 *
 * スペース詳細ページから「+ 対話を追加」ボタンで開くモーダル。
 * 既存の対話一覧を検索・選択し、スペースに一括追加する。
 * CreateSpaceModal のモーダルパターンを踏襲。
 */
'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Conversation } from '@zenn-hackathon04/shared';
import { X, Loader2, Search, MessageSquare, Check } from 'lucide-react';
import { SourceBadge } from '@/components/conversations/SourceBadge';
import { formatDate } from '@/lib/utils/date';

interface AddConversationsModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** 既にスペースに追加済みの対話ID配列 */
  currentConversationIds: string[];
  /** 対話追加時のコールバック（選択されたIDの配列を受け取る） */
  onAdd: (selectedIds: string[]) => Promise<void>;
}

/**
 * 対話追加モーダル
 *
 * GET /api/conversations で全対話を取得し、チェックボックスで複数選択→一括追加する。
 * 既にスペースに含まれる対話はグレーアウトして選択不可にする。
 *
 * @param isOpen - モーダル表示状態
 * @param onClose - 閉じるコールバック
 * @param currentConversationIds - 追加済み対話ID配列
 * @param onAdd - 追加実行コールバック
 */
export function AddConversationsModal({
  isOpen,
  onClose,
  currentConversationIds,
  onAdd,
}: AddConversationsModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /** 既に追加済みのIDセット（O(1)検索用） */
  const currentIdsSet = useMemo(() => new Set(currentConversationIds), [currentConversationIds]);

  /** 対話一覧を取得する */
  const fetchAllConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // ページネーションで全件取得（Hackathon規模なので十分）
      const allConversations: Conversation[] = [];
      let cursor: string | undefined;
      do {
        const url = cursor
          ? `/api/conversations?cursor=${cursor}`
          : '/api/conversations';
        const response = await fetch(url);
        if (!response.ok) throw new Error('対話一覧の取得に失敗しました');
        const data = await response.json();
        if (!data.success) throw new Error(data.error?.message ?? '対話一覧の取得に失敗しました');
        allConversations.push(...data.data.conversations);
        cursor = data.data.nextCursor;
      } while (cursor);

      setConversations(allConversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : '対話一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** モーダル表示時に対話一覧を取得 + フォーカス + キーボード制御 */
  useEffect(() => {
    if (!isOpen) return;

    fetchAllConversations();
    setSelectedIds(new Set());
    setSearchQuery('');

    const timer = setTimeout(() => searchInputRef.current?.focus(), 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
        return;
      }

      // フォーカストラップ
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'input, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  }, [isOpen, isSubmitting, onClose, fetchAllConversations]);

  /** 検索フィルタ適用済みの対話一覧（対話数が多い場合のパフォーマンス考慮） */
  const filteredConversations = useMemo(() =>
    conversations.filter((c) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return c.title.toLowerCase().includes(query);
    }),
    [conversations, searchQuery]
  );

  /** チェックボックスの切り替え */
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /** 追加を実行する */
  const handleSubmit = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAdd(Array.from(selectedIds));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '対話の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedIds, onAdd, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="対話を追加"
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />

      {/* モーダル本体 */}
      <div
        ref={modalRef}
        className="relative flex w-full max-w-lg flex-col rounded-lg shadow-lg"
        style={{ backgroundColor: 'var(--bg-card)', maxHeight: '80vh' }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare
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
              対話を追加
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-sm p-1 transition-opacity hover:opacity-70 disabled:opacity-50"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" style={{ color: 'var(--gray-500)' }} />
          </button>
        </div>

        {/* 検索 */}
        <div className="px-6 pb-3">
          <div
            className="flex items-center gap-2 rounded-sm border px-3 py-2"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--bg-page)',
            }}
          >
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--gray-500)' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="対話を検索..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--black-primary)' }}
            />
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div
            className="mx-6 mb-3 rounded-sm px-3 py-2 text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--red-primary)',
            }}
          >
            {error}
          </div>
        )}

        {/* 対話リスト（スクロール可能） */}
        <div className="flex-1 overflow-y-auto px-6" style={{ minHeight: '200px' }}>
          {isLoading ? (
            <div
              className="flex items-center justify-center gap-2 rounded-sm p-8"
              style={{ color: 'var(--gray-500)' }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">読み込み中...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div
              className="rounded-sm p-8 text-center text-sm"
              style={{ color: 'var(--gray-700)' }}
            >
              {searchQuery ? '一致する対話が見つかりません' : '対話がありません'}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filteredConversations.map((conversation) => {
                const isAlreadyAdded = currentIdsSet.has(conversation.id);
                const isSelected = selectedIds.has(conversation.id);

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => !isAlreadyAdded && toggleSelection(conversation.id)}
                    disabled={isAlreadyAdded || isSubmitting}
                    className="flex items-center gap-3 rounded-sm p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: isSelected
                        ? 'rgba(239, 68, 68, 0.06)'
                        : 'var(--bg-surface)',
                      border: isSelected
                        ? '1px solid var(--red-primary)'
                        : '1px solid var(--border)',
                    }}
                  >
                    {/* チェックボックス */}
                    <div
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm border"
                      style={{
                        borderColor: isAlreadyAdded
                          ? 'var(--gray-300)'
                          : isSelected
                            ? 'var(--red-primary)'
                            : 'var(--border)',
                        backgroundColor: isAlreadyAdded
                          ? 'var(--gray-100)'
                          : isSelected
                            ? 'var(--red-primary)'
                            : 'transparent',
                      }}
                    >
                      {(isAlreadyAdded || isSelected) && (
                        <Check
                          className="h-3 w-3"
                          style={{ color: isAlreadyAdded ? 'var(--gray-400)' : 'white' }}
                        />
                      )}
                    </div>

                    {/* 対話情報 */}
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span
                        className="text-sm font-medium"
                        style={{ color: isAlreadyAdded ? 'var(--gray-400)' : 'var(--black-primary)' }}
                      >
                        {conversation.title}
                        {isAlreadyAdded && (
                          <span className="ml-2 text-xs" style={{ color: 'var(--gray-400)' }}>
                            追加済み
                          </span>
                        )}
                      </span>
                      <time
                        className="text-xs"
                        style={{ color: 'var(--gray-500)' }}
                        dateTime={conversation.updatedAt}
                      >
                        {formatDate(conversation.updatedAt)}
                      </time>
                    </div>

                    <SourceBadge source={conversation.source} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div
          className="flex items-center justify-between p-6 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span className="text-sm" style={{ color: 'var(--gray-500)' }}>
            {selectedIds.size > 0
              ? `${selectedIds.size}件選択中`
              : '対話を選択してください'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
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
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedIds.size === 0}
              className="flex items-center gap-2 rounded-sm px-4 py-2 text-sm text-white transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: 'var(--red-primary)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  追加中...
                </>
              ) : (
                `${selectedIds.size}件を追加`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
