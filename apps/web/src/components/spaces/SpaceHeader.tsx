/**
 * @fileoverview スペース詳細ヘッダーコンポーネント
 *
 * スペース詳細ページのヘッダー部分。
 * 戻るリンク、タイトル、説明文、対話数を表示する。
 */
import Link from 'next/link';
import type { Space } from '@zenn-hackathon04/shared';
import { ArrowLeft, LayoutGrid, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

interface SpaceHeaderProps {
  space: Space;
}

/**
 * スペース詳細ヘッダーコンポーネント
 *
 * @param space - スペースデータ
 */
export function SpaceHeader({ space }: SpaceHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 戻るリンク */}
      <Link
        href="/spaces"
        className="flex w-fit items-center gap-2 text-sm transition-opacity hover:opacity-80"
        style={{ color: 'var(--gray-700)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        スペース一覧に戻る
      </Link>

      {/* タイトル行 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <LayoutGrid
              className="h-5 w-5"
              style={{ color: 'var(--red-primary)' }}
            />
          </div>
          <div>
            <h1
              className="text-2xl font-semibold"
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                color: 'var(--black-primary)',
              }}
            >
              {space.title}
            </h1>
            {space.description && (
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--gray-700)' }}
              >
                {space.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1 rounded px-2 py-1 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--gray-700)',
            }}
          >
            <MessageSquare className="h-3 w-3" />
            対話 {space.conversationIds.length}件
          </span>
          <time
            className="text-xs"
            style={{ color: 'var(--gray-700)' }}
            dateTime={space.updatedAt}
          >
            {formatDate(space.updatedAt)}
          </time>
        </div>
      </div>
    </div>
  );
}
