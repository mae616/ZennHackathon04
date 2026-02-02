/**
 * @fileoverview メモセクションコンポーネント
 *
 * 対話に関連するメモ・要件を表示する。
 * MVP段階では表示のみ。編集機能はSprint 2で実装予定。
 * デザイン: thinkresume.pen のメモセクションを参照
 */
import { FileText } from 'lucide-react';

interface NoteSectionProps {
  note: string | undefined;
}

/**
 * メモセクションコンポーネント
 *
 * @param note - メモ内容（undefinedの場合は何も表示しない）
 */
export function NoteSection({ note }: NoteSectionProps) {
  if (!note) {
    return null;
  }

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
        {/* Sprint 2: 編集ボタン（プレースホルダー） */}
        <button
          type="button"
          disabled
          className="flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs opacity-50"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--gray-700)',
          }}
          title="編集機能は Sprint 2 で実装予定"
        >
          編集
        </button>
      </div>

      {/* メモ内容 */}
      <p
        className="whitespace-pre-wrap text-sm"
        style={{ color: 'var(--gray-700)' }}
      >
        {note}
      </p>
    </section>
  );
}
