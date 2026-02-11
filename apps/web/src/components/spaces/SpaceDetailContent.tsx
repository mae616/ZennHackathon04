/**
 * @fileoverview スペース詳細コンテンツのClient Componentラッパー
 *
 * スペースの詳細表示（含まれる対話・メモ・洞察・統合コンテキスト対話）を一元管理する。
 * 洞察の取得・保存状態を管理し、ThinkResumePanelでの保存操作を
 * InsightSectionに反映する。
 *
 * RDD参照: §スペース機能（Web）UI構成
 *   1. 含まれる対話一覧
 *   2. メモ・要件など（編集可能）
 *   3. 追加した洞察
 *   4. 統合コンテキストで対話
 */
'use client';

import { useMemo } from 'react';
import type { Space } from '@zenn-hackathon04/shared';
import { SpaceHeader } from '@/components/spaces/SpaceHeader';
import { ConversationsInSpaceSection } from '@/components/spaces/ConversationsInSpaceSection';
import { NoteSection } from '@/components/conversations/NoteSection';
import { InsightSection } from '@/components/conversations/InsightSection';
import { ThinkResumePanel } from '@/components/conversations/ThinkResumePanel';
import { generateSpaceGreetingMessage } from '@/lib/vertex/types';
import { useInsights } from '@/hooks/useInsights';

interface SpaceDetailContentProps {
  /** スペースデータ */
  space: Space;
}

/**
 * スペース詳細のメインコンテンツ
 *
 * RDD §スペース機能（Web）UI構成に準拠:
 * 左カラム: 含まれる対話、メモ、洞察
 * 右カラム: 統合コンテキストで対話（ThinkResumePanel）
 *
 * 洞察の取得・更新はuseInsightsフックで一元管理し、
 * ThinkResumePanelでの保存操作をInsightSectionに反映する。
 *
 * @param space - スペースデータ
 */
export function SpaceDetailContent({ space }: SpaceDetailContentProps) {
  /** 初回挨拶メッセージ（スペースコンテキストから生成） */
  const greeting = useMemo(
    () => generateSpaceGreetingMessage(space.title, space.conversationIds.length),
    [space.title, space.conversationIds.length]
  );

  /** chatPayload をメモ化（オブジェクト参照の安定化） */
  const chatPayload = useMemo(
    () => ({ spaceId: space.id }),
    [space.id]
  );

  /** 洞察の取得・管理（useInsightsフックで共通化） */
  const { insights, isLoading: isInsightsLoading, hasError: insightsError, refetch: refetchInsights } =
    useInsights(`/api/spaces/${space.id}/insights`);

  return (
    <div className="flex flex-1 gap-6">
      {/* 左カラム: ヘッダー、対話一覧、メモ、洞察 */}
      <div className="flex flex-1 flex-col gap-6">
        <SpaceHeader space={space} />
        <ConversationsInSpaceSection spaceId={space.id} conversationIds={space.conversationIds} />
        <NoteSection apiEndpoint={`/api/spaces/${space.id}`} note={space.note} />
        <InsightSection
          insights={insights}
          isLoading={isInsightsLoading}
          hasError={insightsError}
          onRetry={refetchInsights}
        />
      </div>

      {/* 右カラム: 統合コンテキストで対話（スペース内の全対話を統合してGeminiと対話） */}
      <div className="sticky top-8 w-[400px] flex-shrink-0 self-start h-[calc(100vh-4rem)]">
        <ThinkResumePanel
          greeting={greeting}
          chatPayload={chatPayload}
          insightSpaceId={space.id}
          onInsightSaved={refetchInsights}
        />
      </div>
    </div>
  );
}
