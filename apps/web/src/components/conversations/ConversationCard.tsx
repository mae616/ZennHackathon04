/**
 * @fileoverview 対話カードコンポーネント
 *
 * 保存した対話を一覧表示するためのカード。
 * RDD準拠: タイトル、ソースバッジ、日時、メモ、タグ、洞察バッジ、思考再開ボタン
 */
import Link from 'next/link';
import type { Conversation } from '@zenn-hackathon04/shared';
import { SourceBadge } from './SourceBadge';
import { ArrowRight, Lightbulb } from 'lucide-react';

interface ConversationCardProps {
  conversation: Conversation;
}

/**
 * 日時を表示用にフォーマットする
 *
 * @param dateString - ISO 8601形式の日時文字列
 * @returns フォーマット済み日時（例: 2024/01/15 14:30）
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 対話カードコンポーネント
 *
 * @param conversation - 対話データ
 */
export function ConversationCard({ conversation }: ConversationCardProps) {
  // 洞察数（将来的にはconversation.insightsから取得）
  const insightCount = 0;

  return (
    <article
      className="flex flex-col gap-4 rounded-lg border p-6"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-card)',
      }}
    >
      {/* ヘッダー: タイトル、ソースバッジ、日時 */}
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--black-primary)' }}
          >
            {conversation.title}
          </h2>
          <time
            className="text-xs"
            style={{ color: 'var(--gray-700)' }}
            dateTime={conversation.updatedAt}
          >
            {formatDate(conversation.updatedAt)}
          </time>
        </div>
        <SourceBadge source={conversation.source} />
      </header>

      {/* メモ（要約） */}
      {conversation.note && (
        <p
          className="line-clamp-2 text-sm"
          style={{ color: 'var(--gray-700)' }}
        >
          {conversation.note}
        </p>
      )}

      {/* フッター: タグ、洞察バッジ */}
      <footer className="flex items-center justify-between">
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
          {insightCount > 0 && (
            <span
              className="flex items-center gap-1 rounded px-2 py-1 text-xs"
              style={{
                backgroundColor: '#FEF9C3',
                color: '#854D0E',
              }}
            >
              <Lightbulb className="h-3 w-3" />
              {insightCount}件の洞察
            </span>
          )}
        </div>

        {/* 思考を再開ボタン */}
        <Link
          href={`/conversations/${conversation.id}`}
          className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--red-primary)' }}
        >
          思考を再開
          <ArrowRight className="h-4 w-4" />
        </Link>
      </footer>
    </article>
  );
}
