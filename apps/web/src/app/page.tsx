/**
 * @fileoverview 対話一覧ページ
 *
 * 保存した対話の一覧を表示するメインページ。
 * Server Componentとして実装し、APIから直接データを取得する。
 */
import type { Conversation } from '@zenn-hackathon04/shared';
import { Header } from '@/components/layout/Header';
import { ConversationList } from '@/components/conversations/ConversationList';
import { fetchConversations } from '@/lib/api';

/**
 * 対話一覧ページコンポーネント
 *
 * APIから対話一覧を取得し、カードリストとして表示する。
 * エラー時はエラーメッセージを表示。
 */
export default async function HomePage() {
  let conversations: Conversation[] = [];
  let error: string | null = null;

  try {
    const response = await fetchConversations();
    if (response.success) {
      conversations = response.data.conversations;
    } else {
      error = response.error.message;
    }
  } catch (e) {
    // Firebaseが未設定の場合などは空配列で表示
    console.error('Failed to fetch conversations:', e);
    error = null; // 初期状態は空一覧を表示
  }

  return (
    <div
      className="flex h-full flex-col gap-8 px-12 py-10"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      <Header
        title="対話一覧"
        subtitle="LLMとの対話を、資産に変える"
        showSearch
      />

      {error ? (
        <div
          className="rounded-lg border p-4 text-center"
          style={{
            borderColor: 'var(--red-primary)',
            backgroundColor: '#FEF2F2',
            color: 'var(--red-primary)',
          }}
        >
          {error}
        </div>
      ) : (
        <ConversationList conversations={conversations} />
      )}
    </div>
  );
}
