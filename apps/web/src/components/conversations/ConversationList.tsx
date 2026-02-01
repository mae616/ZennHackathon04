/**
 * @fileoverview 対話一覧コンポーネント
 *
 * 対話カードのリストを表示する。
 * 空の場合は案内メッセージを表示。
 */
import type { Conversation } from '@zenn-hackathon04/shared';
import { ConversationCard } from './ConversationCard';
import { MessageSquare } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
}

/**
 * 対話一覧コンポーネント
 *
 * @param conversations - 表示する対話の配列
 */
export function ConversationList({ conversations }: ConversationListProps) {
  // 空の場合
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <MessageSquare
          className="h-12 w-12"
          style={{ color: 'var(--gray-400)' }}
        />
        <div className="text-center">
          <p
            className="text-lg font-medium"
            style={{ color: 'var(--black-primary)' }}
          >
            まだ対話がありません
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--gray-700)' }}>
            Chrome拡張機能からLLMとの対話を保存してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {conversations.map((conversation) => (
        <ConversationCard key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
}
