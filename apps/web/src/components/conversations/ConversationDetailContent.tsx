/**
 * @fileoverview 対話詳細コンテンツのClient Componentラッパー
 *
 * insightsの取得・更新状態を一元管理し、
 * ThinkResumePanelとInsightSection間の連携を実現する。
 * Server Componentの詳細ページからconversationを受け取り、
 * クライアント側で洞察の状態管理を行う。
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Conversation, Insight } from '@zenn-hackathon04/shared';
import { ChatHistorySection } from '@/components/conversations/ChatHistorySection';
import { NoteSection } from '@/components/conversations/NoteSection';
import { InsightSection } from '@/components/conversations/InsightSection';
import { ThinkResumePanel } from '@/components/conversations/ThinkResumePanel';

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
  /** 洞察一覧 */
  const [insights, setInsights] = useState<Insight[]>([]);
  /** 洞察ローディング状態 */
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);

  /**
   * 洞察一覧をAPIから取得する
   */
  const fetchInsights = useCallback(async () => {
    try {
      setIsInsightsLoading(true);
      const response = await fetch(`/api/conversations/${conversation.id}/insights`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInsights(data.data.insights);
        }
      }
    } catch {
      // 取得エラーは静かに失敗（InsightSectionで空状態表示）
      console.error('洞察の取得に失敗しました');
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
      {/* 左カラム: 対話履歴、メモ、洞察 */}
      <div className="flex flex-1 flex-col gap-6">
        <ChatHistorySection
          messages={conversation.messages}
          source={conversation.source}
        />
        <NoteSection conversationId={conversation.id} note={conversation.note} />
        <InsightSection
          conversationId={conversation.id}
          insights={insights}
          isLoading={isInsightsLoading}
        />
      </div>

      {/* 右カラム: 思考再開パネル */}
      <div className="w-[400px] flex-shrink-0">
        <ThinkResumePanel
          conversation={conversation}
          onInsightSaved={handleInsightSaved}
        />
      </div>
    </div>
  );
}
