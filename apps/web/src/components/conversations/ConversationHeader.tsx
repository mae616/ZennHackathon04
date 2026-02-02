/**
 * @fileoverview 対話詳細ヘッダーコンポーネント
 *
 * 対話詳細ページのヘッダー部分。
 * 戻るリンク、タイトル、ソースバッジ、日時を表示する。
 * デザイン: thinkresume.pen のbackLink, pageTitle2を参照
 */
import Link from 'next/link';
import type { Conversation } from '@zenn-hackathon04/shared';
import { ArrowLeft } from 'lucide-react';
import { SourceBadge } from './SourceBadge';
import { formatDate } from '@/lib/utils/date';

interface ConversationHeaderProps {
  conversation: Conversation;
}

/**
 * 対話詳細ヘッダーコンポーネント
 *
 * @param conversation - 対話データ
 */
export function ConversationHeader({ conversation }: ConversationHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 戻るリンク */}
      <Link
        href="/"
        className="flex w-fit items-center gap-2 text-sm transition-opacity hover:opacity-80"
        style={{ color: 'var(--gray-700)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        一覧に戻る
      </Link>

      {/* タイトル行 */}
      <div className="flex items-start justify-between gap-4">
        <h1
          className="text-2xl font-semibold"
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            color: 'var(--black-primary)',
          }}
        >
          {conversation.title}
        </h1>
        <div className="flex items-center gap-3">
          <SourceBadge source={conversation.source} />
          <time
            className="text-xs"
            style={{ color: 'var(--gray-700)' }}
            dateTime={conversation.updatedAt}
          >
            {formatDate(conversation.updatedAt)}
          </time>
        </div>
      </div>

      {/* タグ */}
      {conversation.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {conversation.tags.map((tag) => (
            <span
              key={tag}
              className="rounded px-2 py-1 text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--gray-700)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
