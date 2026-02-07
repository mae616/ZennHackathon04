/**
 * @fileoverview 洞察セクションコンポーネント
 *
 * Geminiとの対話から保存したQ&A形式の洞察を表示する。
 * ConversationDetailContentから洞察データを受け取り、
 * Q&Aカード形式でリスト表示する。
 *
 * デザイン: thinkresume.pen の追加した洞察セクションを参照
 */
'use client';

import ReactMarkdown from 'react-markdown';
import { Lightbulb, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import type { Insight } from '@zenn-hackathon04/shared';

interface InsightSectionProps {
  /** 紐づく対話のID */
  conversationId: string;
  /** 洞察一覧 */
  insights: Insight[];
  /** ローディング状態 */
  isLoading: boolean;
}

/**
 * 洞察カードコンポーネント（Q&A形式）
 *
 * ユーザーの質問とGeminiの回答をペアで表示する。
 *
 * @param insight - 洞察データ
 */
function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-sm p-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* 質問 */}
      <div className="flex gap-2">
        <MessageSquare
          className="mt-0.5 h-4 w-4 flex-shrink-0"
          style={{ color: 'var(--gray-500)' }}
        />
        <div className="flex-1">
          <p
            className="mb-1 text-xs font-medium"
            style={{ color: 'var(--gray-500)' }}
          >
            質問
          </p>
          <p className="text-sm" style={{ color: 'var(--black-primary)' }}>
            {insight.question}
          </p>
        </div>
      </div>

      {/* 区切り線 */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* 回答 */}
      <div className="flex gap-2">
        <Sparkles
          className="mt-0.5 h-4 w-4 flex-shrink-0"
          style={{ color: 'var(--red-primary)' }}
        />
        <div className="flex-1">
          <p
            className="mb-1 text-xs font-medium"
            style={{ color: 'var(--red-primary)' }}
          >
            Geminiの回答
          </p>
          <div
            className="prose prose-sm max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            style={{ color: 'var(--black-primary)' }}
          >
            <ReactMarkdown>{insight.answer}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 洞察セクションコンポーネント
 *
 * 保存された洞察をQ&A形式カードでリスト表示する。
 * 件数バッジ、ローディング状態、空状態を管理する。
 *
 * @param conversationId - 対話ID
 * @param insights - 洞察データ配列
 * @param isLoading - ローディング状態
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 将来の洞察削除機能等で使用予定
export function InsightSection({ conversationId, insights, isLoading }: InsightSectionProps) {
  return (
    <section
      className="flex flex-col gap-4 rounded-sm p-6"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb
            className="h-[18px] w-[18px]"
            style={{ color: 'var(--red-primary)' }}
          />
          <h2
            className="text-base font-semibold"
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              color: 'var(--black-primary)',
            }}
          >
            追加した洞察
          </h2>
        </div>
        <span
          className="rounded-sm px-2 py-1 text-xs"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--gray-700)',
          }}
        >
          {isLoading ? '...' : `${insights.length}件`}
        </span>
      </div>

      {/* 洞察リスト */}
      {isLoading ? (
        <div
          className="flex items-center justify-center gap-2 rounded-sm p-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--gray-500)',
          }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">読み込み中...</span>
        </div>
      ) : insights.length === 0 ? (
        <div
          className="rounded-sm p-4 text-center text-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--gray-700)',
          }}
        >
          Geminiとの対話から洞察を保存できます
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </section>
  );
}
