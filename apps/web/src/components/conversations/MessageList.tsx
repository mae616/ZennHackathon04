/**
 * @fileoverview メッセージ一覧コンポーネント
 *
 * 対話内の全メッセージをリスト表示する。
 * デザイン: thinkresume.pen のchatMessagesを参照
 */
import type { Message } from '@zenn-hackathon04/shared';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
}

/**
 * メッセージ一覧コンポーネント
 *
 * @param messages - 表示するメッセージの配列
 */
export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--gray-700)' }}>
        メッセージがありません
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
