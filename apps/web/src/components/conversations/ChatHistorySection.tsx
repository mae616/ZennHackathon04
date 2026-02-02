/**
 * @fileoverview 対話履歴セクションコンポーネント
 *
 * 保存した対話のメッセージ履歴を表示するセクション。
 * デザイン: thinkresume.pen の対話履歴セクションを参照
 */
import type { Message, SourcePlatform } from '@zenn-hackathon04/shared';
import { MessageSquare } from 'lucide-react';
import { MessageList } from './MessageList';

interface ChatHistorySectionProps {
  messages: Message[];
  source: SourcePlatform;
}

/** ソースプラットフォームの表示名 */
const sourceLabels: Record<SourcePlatform, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
};

/**
 * 対話履歴セクションコンポーネント
 *
 * @param messages - 対話のメッセージ配列
 * @param source - 対話のソースプラットフォーム
 */
export function ChatHistorySection({ messages, source }: ChatHistorySectionProps) {
  return (
    <section
      className="flex flex-col gap-4 rounded-sm p-6"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-2">
        <MessageSquare
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
          {sourceLabels[source]}との対話履歴
        </h2>
      </div>

      {/* メッセージリスト */}
      <MessageList messages={messages} />
    </section>
  );
}
