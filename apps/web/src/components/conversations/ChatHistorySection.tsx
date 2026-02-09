/**
 * @fileoverview 対話履歴セクションコンポーネント
 *
 * 保存した対話のメッセージ履歴を表示するセクション。
 * コンテンツが長い場合は折りたたみ表示し、「もっと表示」で全文展開する。
 * デザイン: thinkresume.pen の対話履歴セクションを参照
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message, SourcePlatform } from '@zenn-hackathon04/shared';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
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

/** 折りたたみ時の最大高さ（px） */
const COLLAPSED_MAX_HEIGHT = 240;

/**
 * 対話履歴セクションコンポーネント
 *
 * @param messages - 対話のメッセージ配列
 * @param source - 対話のソースプラットフォーム
 */
export function ChatHistorySection({ messages, source }: ChatHistorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  /** コンテンツが折りたたみ閾値を超えるか判定 */
  useEffect(() => {
    if (contentRef.current) {
      setNeedsCollapse(contentRef.current.scrollHeight > COLLAPSED_MAX_HEIGHT);
    }
  }, [messages]);

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

      {/* メッセージリスト（折りたたみ対応） */}
      <div className="relative">
        <div
          ref={contentRef}
          className="overflow-hidden transition-[max-height] duration-300"
          style={{
            maxHeight: !isExpanded && needsCollapse ? `${COLLAPSED_MAX_HEIGHT}px` : undefined,
          }}
        >
          <MessageList messages={messages} />
        </div>

        {/* 折りたたみ時のグラデーションフェード */}
        {needsCollapse && !isExpanded && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--bg-page, white))',
            }}
          />
        )}
      </div>

      {/* もっと表示 / 折りたたむボタン */}
      {needsCollapse && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 self-center text-xs transition-opacity hover:opacity-70"
          style={{ color: 'var(--gray-500)' }}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              折りたたむ
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              もっと表示
            </>
          )}
        </button>
      )}
    </section>
  );
}
