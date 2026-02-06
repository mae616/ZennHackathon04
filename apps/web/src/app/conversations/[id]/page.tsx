/**
 * @fileoverview 対話詳細ページ
 *
 * 保存した対話の詳細（メッセージ履歴・メモ・洞察）を表示する。
 * Sprint 2で思考再開機能（Gemini連携）を追加予定。
 *
 * RDD参照:
 * - doc/input/rdd.md §機能要件 [P0] 対話一覧・詳細表示
 * - doc/input/rdd.md §思考再開機能（UI構成）
 */
import { notFound } from 'next/navigation';
import type { Conversation } from '@zenn-hackathon04/shared';
import { fetchConversation } from '@/lib/api';
import { ConversationHeader } from '@/components/conversations/ConversationHeader';
import { ChatHistorySection } from '@/components/conversations/ChatHistorySection';
import { NoteSection } from '@/components/conversations/NoteSection';
import { InsightSection } from '@/components/conversations/InsightSection';
import { ThinkResumePanel } from '@/components/conversations/ThinkResumePanel';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * 対話詳細ページコンポーネント
 *
 * Server Componentとして実装。APIから対話データを取得し、
 * 存在しない場合は404ページを表示する。
 *
 * @param params - ルートパラメータ（id: 対話ID）
 */
export default async function ConversationDetailPage({ params }: Props) {
  const { id } = await params;

  let conversation: Conversation | null = null;

  try {
    const response = await fetchConversation(id);
    if (response.success) {
      conversation = response.data;
    }
  } catch {
    // APIエラーの場合は404として扱う
    // エラー詳細はサーバーログで確認可能
  }

  if (!conversation) {
    notFound();
  }

  return (
    <div
      className="flex h-full flex-col gap-6 px-10 py-8"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      {/* ヘッダー: 戻るリンク、タイトル、ソースバッジ、タグ */}
      <ConversationHeader conversation={conversation} />

      {/* メインコンテンツ: 左カラム（履歴・メモ・洞察）+ 右カラム（思考再開） */}
      <div className="flex flex-1 gap-6">
        {/* 左カラム: 対話履歴、メモ、洞察 */}
        <div className="flex flex-1 flex-col gap-6">
          <ChatHistorySection
            messages={conversation.messages}
            source={conversation.source}
          />
          <NoteSection conversationId={conversation.id} note={conversation.note} />
          <InsightSection />
        </div>

        {/* 右カラム: 思考再開パネル */}
        <div className="w-[400px] flex-shrink-0">
          <ThinkResumePanel conversation={conversation} />
        </div>
      </div>
    </div>
  );
}
