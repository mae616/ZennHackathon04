/**
 * @fileoverview メモセクションコンポーネント
 *
 * 対話に関連するメモ・要件を表示・編集する。
 * RDD参照: §メモ・要件の編集機能
 * - 編集モード: 既存メモの直接編集
 * - 追記機能: タイムスタンプ付き「YYYY/MM/DD HH:MM 追記」
 */
'use client';

import { useState, useCallback } from 'react';
import { FileText, Pencil, Plus, X, Loader2, Check } from 'lucide-react';
import { formatAppendHeader } from '@/lib/utils/date';

interface NoteSectionProps {
  /** 対話ID（API呼び出し用） */
  conversationId: string;
  /** メモ内容（undefinedの場合は空欄として表示） */
  note: string | undefined;
}

/** 編集モードの種類 */
type EditMode = 'none' | 'edit' | 'append';

/**
 * メモセクションコンポーネント
 *
 * @param conversationId - 対話ID
 * @param note - メモ内容
 */
export function NoteSection({ conversationId, note }: NoteSectionProps) {
  const [currentNote, setCurrentNote] = useState(note ?? '');
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 編集モードを開始する
   */
  const startEdit = useCallback(() => {
    setEditValue(currentNote);
    setEditMode('edit');
    setError(null);
  }, [currentNote]);

  /**
   * 追記モードを開始する
   */
  const startAppend = useCallback(() => {
    setEditValue('');
    setEditMode('append');
    setError(null);
  }, []);

  /**
   * 編集をキャンセルする
   */
  const cancelEdit = useCallback(() => {
    setEditMode('none');
    setEditValue('');
    setError(null);
  }, []);

  /**
   * メモを保存する（編集または追記）
   */
  const saveNote = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let newNote: string;

      if (editMode === 'edit') {
        // 直接編集: そのまま置き換え
        newNote = editValue;
      } else {
        // 追記: タイムスタンプ付きで追加
        const header = formatAppendHeader();
        const appendContent = `\n\n---\n${header}\n${editValue}`;
        newNote = currentNote ? `${currentNote}${appendContent}` : `${header}\n${editValue}`;
      }

      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? '保存に失敗しました');
      }

      // 成功時: UIを更新
      setCurrentNote(newNote);
      setEditMode('none');
      setEditValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentNote, editMode, editValue]);

  return (
    <section
      className="flex flex-col gap-3 rounded-sm p-6"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText
            className="h-[18px] w-[18px]"
            style={{ color: 'var(--black-primary)' }}
          />
          <h2
            className="text-base font-semibold"
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              color: 'var(--black-primary)',
            }}
          >
            メモ・要件
          </h2>
        </div>

        {/* アクションボタン群（表示モード時のみ） */}
        {editMode === 'none' && (
          <div className="flex items-center gap-2">
            {/* 追記ボタン */}
            <button
              type="button"
              onClick={startAppend}
              className="flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs transition-colors hover:opacity-80"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--gray-700)',
              }}
              title="メモを追記"
            >
              <Plus className="h-3 w-3" />
              追記
            </button>
            {/* 編集ボタン */}
            <button
              type="button"
              onClick={startEdit}
              className="flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs transition-colors hover:opacity-80"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--gray-700)',
              }}
              title="メモを編集"
            >
              <Pencil className="h-3 w-3" />
              編集
            </button>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div
          className="rounded-sm px-3 py-2 text-sm"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--red-primary, #ef4444)',
          }}
        >
          {error}
        </div>
      )}

      {/* 表示モード */}
      {editMode === 'none' && (
        <>
          {currentNote ? (
            <p
              className="whitespace-pre-wrap text-sm"
              style={{ color: 'var(--gray-700)' }}
            >
              {currentNote}
            </p>
          ) : (
            <p
              className="text-sm italic"
              style={{ color: 'var(--gray-400)' }}
            >
              メモはありません。「追記」ボタンでメモを追加できます。
            </p>
          )}
        </>
      )}

      {/* 編集モード */}
      {editMode === 'edit' && (
        <div className="flex flex-col gap-3">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="メモを入力..."
            rows={6}
            className="w-full resize-none rounded-sm border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--gray-700)',
              backgroundColor: 'var(--bg-page)',
            }}
            disabled={isLoading}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-sm px-3 py-1.5 text-xs transition-colors hover:opacity-80 disabled:opacity-50"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--gray-700)',
              }}
            >
              <X className="h-3 w-3" />
              キャンセル
            </button>
            <button
              type="button"
              onClick={saveNote}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-sm px-3 py-1.5 text-xs text-white transition-colors hover:opacity-80 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--red-primary, #ef4444)',
              }}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              保存
            </button>
          </div>
        </div>
      )}

      {/* 追記モード */}
      {editMode === 'append' && (
        <div className="flex flex-col gap-3">
          {/* 既存メモ（読み取り専用で表示） */}
          {currentNote && (
            <div
              className="rounded-sm border px-3 py-2"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-page)',
              }}
            >
              <p
                className="mb-2 text-xs font-medium"
                style={{ color: 'var(--gray-500)' }}
              >
                既存のメモ
              </p>
              <p
                className="whitespace-pre-wrap text-sm"
                style={{ color: 'var(--gray-700)' }}
              >
                {currentNote}
              </p>
            </div>
          )}

          {/* 追記入力エリア */}
          <div>
            <p
              className="mb-2 text-xs font-medium"
              style={{ color: 'var(--gray-500)' }}
            >
              追記内容（保存時にタイムスタンプが付きます）
            </p>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="追記する内容を入力..."
              rows={4}
              className="w-full resize-none rounded-sm border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--gray-700)',
                backgroundColor: 'var(--bg-page)',
              }}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-sm px-3 py-1.5 text-xs transition-colors hover:opacity-80 disabled:opacity-50"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--gray-700)',
              }}
            >
              <X className="h-3 w-3" />
              キャンセル
            </button>
            <button
              type="button"
              onClick={saveNote}
              disabled={isLoading || !editValue.trim()}
              className="flex items-center gap-1 rounded-sm px-3 py-1.5 text-xs text-white transition-colors hover:opacity-80 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--red-primary, #ef4444)',
              }}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              追記を保存
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
