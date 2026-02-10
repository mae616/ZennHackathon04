/**
 * @fileoverview 対話詳細コンテンツのClient Componentラッパー
 *
 * insightsの取得・更新状態を一元管理し、
 * ThinkResumePanelとInsightSection間の連携を実現する。
 * Server Componentの詳細ページからconversationを受け取り、
 * クライアント側で洞察の状態管理を行う。
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Conversation, Insight } from '@zenn-hackathon04/shared';
import { ConversationHeader } from '@/components/conversations/ConversationHeader';
import { ChatHistorySection } from '@/components/conversations/ChatHistorySection';
import { NoteSection } from '@/components/conversations/NoteSection';
import { InsightSection } from '@/components/conversations/InsightSection';
import { ThinkResumePanel } from '@/components/conversations/ThinkResumePanel';
import { generateGreetingMessage, type ThinkResumeContext } from '@/lib/vertex/types';

interface ConversationDetailContentProps {
  /** 対話データ */
  conversation: Conversation;
}

/**
 * 対話詳細のメインコンテンツ
 *
 * 洞察の取得・更新を一元管理し、ThinkResumePanelでの保存操作を
 * InsightSectionに反映する。
 *
 * @param conversation - 対話データ
 */
export function ConversationDetailContent({ conversation }: ConversationDetailContentProps) {
  /** 初回挨拶メッセージ（対話コンテキストから生成） */
  const greeting = useMemo(() => {
    const context: ThinkResumeContext = {
      conversationSummary: conversation.messages
        .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n\n'),
      title: conversation.title,
      note: conversation.note,
    };
    return generateGreetingMessage(context);
  }, [conversation.messages, conversation.title, conversation.note]);

  /** chatPayload をメモ化（オブジェクト参照の安定化） */
  const chatPayload = useMemo(
    () => ({ conversationId: conversation.id }),
    [conversation.id]
  );

  /** 洞察一覧 */
  const [insights, setInsights] = useState<Insight[]>([]);
  /** 洞察ローディング状態 */
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);
  /** 洞察取得エラー */
  const [insightsError, setInsightsError] = useState(false);

  /**
   * 洞察一覧をAPIから取得する
   */
  const fetchInsights = useCallback(async () => {
    try {
      setIsInsightsLoading(true);
      setInsightsError(false);
      const response = await fetch(`/api/conversations/${conversation.id}/insights`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInsights(data.data.insights);
        } else {
          setInsightsError(true);
        }
      } else {
        setInsightsError(true);
      }
    } catch {
      setInsightsError(true);
    } finally {
      setIsInsightsLoading(false);
    }
  }, [conversation.id]);

  /**
   * 初回マウント時に洞察を取得
   */
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  /**
   * 洞察保存後のコールバック（リストを再取得）
   */
  const handleInsightSaved = useCallback(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <div className="flex flex-1 gap-6">
      {/* 左カラム: ヘッダー、対話履歴、メモ、洞察 */}
      <div className="flex flex-1 flex-col gap-6">
        <ConversationHeader conversation={conversation} />
        <ChatHistorySection
          messages={conversation.messages}
          source={conversation.source}
        />
        <NoteSection apiEndpoint={`/api/conversations/${conversation.id}`} note={conversation.note} />
        <InsightSection
          conversationId={conversation.id}
          insights={insights}
          isLoading={isInsightsLoading}
          hasError={insightsError}
          onRetry={fetchInsights}
        />
      </div>

      {/* 右カラム: 思考再開パネル（ページスクロール時もビューポートに固定） */}
      <div className="sticky top-8 w-[400px] flex-shrink-0 self-start h-[calc(100vh-4rem)]">
        <ThinkResumePanel
          greeting={greeting}
          chatPayload={chatPayload}
          insightConversationId={conversation.id}
          onInsightSaved={handleInsightSaved}
        />
      </div>
    </div>
  );
}
