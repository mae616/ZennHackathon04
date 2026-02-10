/**
 * @fileoverview スペースカードコンポーネント
 *
 * スペース一覧で使用するカードUI。
 * RDD準拠: アイコン、タイトル、説明文、統計（対話N件）
 */
import Link from 'next/link';
import type { Space } from '@zenn-hackathon04/shared';
import { ArrowRight, LayoutGrid, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

interface SpaceCardProps {
  space: Space;
}

/**
 * スペースカードコンポーネント
 *
 * @param space - スペースデータ
 */
export function SpaceCard({ space }: SpaceCardProps) {
  const conversationCount = space.conversationIds.length;

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="group block rounded-lg transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
    >
      <article
        className="flex flex-col gap-4 rounded-lg border border-[var(--border)] p-6 transition-colors group-hover:border-[#E8E8E8]/40"
        style={{
          backgroundColor: 'var(--bg-card)',
        }}
      >
        {/* ヘッダー: アイコン + タイトル + 日時 */}
        <header className="flex items-start justify-between">
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
            <div className="flex flex-col gap-1">
              <h2
                className="text-base font-semibold"
                style={{ color: 'var(--black-primary)' }}
              >
                {space.title}
              </h2>
              <time
                className="text-xs"
                style={{ color: 'var(--gray-700)' }}
                dateTime={space.updatedAt}
              >
                {formatDate(space.updatedAt)}
              </time>
            </div>
          </div>
        </header>

        {/* 説明文 */}
        {space.description && (
          <p
            className="line-clamp-2 text-sm"
            style={{ color: 'var(--gray-700)' }}
          >
            {space.description}
          </p>
        )}

        {/* フッター: 統計 + アクション */}
        <footer className="flex items-center justify-between">
          <div className="flex gap-3">
            <span
              className="flex items-center gap-1 rounded px-2 py-1 text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--gray-700)',
              }}
            >
              <MessageSquare className="h-3 w-3" />
              対話 {conversationCount}件
            </span>
          </div>

          {/* コンテキスト確認ラベル */}
          <span
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: 'var(--red-primary)' }}
          >
            コンテキストを確認
            <ArrowRight className="h-4 w-4" />
          </span>
        </footer>
      </article>
    </Link>
  );
}
