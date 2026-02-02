/**
 * @fileoverview メッセージバブルコンポーネント
 *
 * 対話内の個々のメッセージを表示する。
 * user: 黒背景、assistant: 緑背景、system: グレー背景で区別する。
 * デザイン: thinkresume.pen のchatMessagesを参照
 */
import type { Message } from '@zenn-hackathon04/shared';

interface MessageBubbleProps {
  message: Message;
}

/** 役割ごとの表示設定 */
const roleConfig = {
  user: {
    label: 'You',
    avatarBg: 'var(--black-primary)',
    avatarText: 'U',
  },
  assistant: {
    label: 'AI',
    avatarBg: 'var(--green-success)',
    avatarText: 'AI',
  },
  system: {
    label: 'System',
    avatarBg: 'var(--gray-400)',
    avatarText: 'S',
  },
} as const;

/**
 * メッセージバブルコンポーネント
 *
 * @param message - 表示するメッセージ
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const config = roleConfig[message.role];

  return (
    <div className="flex gap-3">
      {/* アバター */}
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm"
        style={{ backgroundColor: config.avatarBg }}
      >
        <span className="text-xs font-medium text-white">{config.avatarText}</span>
      </div>

      {/* メッセージ内容 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--gray-700)' }}
        >
          {config.label}
        </span>
        <p
          className="whitespace-pre-wrap break-words text-sm"
          style={{ color: 'var(--black-primary)' }}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}
