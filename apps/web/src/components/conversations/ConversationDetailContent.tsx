/**
 * @fileoverview 対話詳細コンテンツのClient Componentラッパー
 *
 * insightsの取得・更新状態を一元管理し、
 * ThinkResumePanelとInsightSection間の連携を実現する。
 * Server Componentの詳細ページからconversationを受け取り、
 * クライアント側で洞察の状態管理を行う。
 */
'use client';

import { useMemo } from 'react';
import type { Conversation } from '@zenn-hackathon04/shared';
import { ConversationHeader } from '@/components/conversations/ConversationHeader';
import { ChatHistorySection } from '@/components/conversations/ChatHistorySection';
import { NoteSection } from '@/components/conversations/NoteSection';
import { InsightSection } from '@/components/conversations/InsightSection';
import { ThinkResumePanel } from '@/components/conversations/ThinkResumePanel';
import { generateGreetingMessage, type ThinkResumeContext } from '@/lib/vertex/types';
import { useInsights } from '@/hooks/useInsights';

interface ConversationDetailContentProps {
  /** 対話データ */
  conversation: Conversation;
}

/**
 * 対話詳細のメインコンテンツ
 *
 * 洞察の取得・更新はuseInsightsフックで一元管理し、
 * ThinkResumePanelでの保存操作をInsightSectionに反映する。
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

  /** 洞察の取得・管理（useInsightsフックで共通化） */
  const { insights, isLoading: isInsightsLoading, hasError: insightsError, refetch: refetchInsights } =
    useInsights(`/api/conversations/${conversation.id}/insights`);

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
          onRetry={refetchInsights}
        />
      </div>

      {/* 右カラム: 思考再開パネル（ページスクロール時もビューポートに固定） */}
      <div className="sticky top-8 w-[400px] flex-shrink-0 self-start h-[calc(100vh-4rem)]">
        <ThinkResumePanel
          greeting={greeting}
          chatPayload={chatPayload}
          insightConversationId={conversation.id}
          onInsightSaved={refetchInsights}
        />
      </div>
    </div>
  );
}
