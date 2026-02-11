/**
 * @fileoverview 対話一覧ページ
 *
 * 保存した対話の一覧を表示するメインページ。
 * Server Componentとして実装し、APIから直接データを取得する。
 * URLクエリパラメータ(?q=xxx&tag=xxx)でフィルタリング対応。
 */
import { Suspense } from 'react';
import type { Conversation } from '@zenn-hackathon04/shared';
import { Header } from '@/components/layout/Header';
import { ConversationList } from '@/components/conversations/ConversationList';
import { SearchBar } from '@/components/conversations/SearchBar';
import { TagFilter } from '@/components/conversations/TagFilter';
import { fetchConversations } from '@/lib/api';

interface Props {
  searchParams: Promise<{ q?: string; tag?: string }>;
}

/**
 * 対話一覧ページコンポーネント
 *
 * APIから対話一覧を取得し、カードリストとして表示する。
 * searchParamsでタグフィルタ・タイトル検索に対応。
 */
export default async function HomePage({ searchParams }: Props) {
  const { q, tag } = await searchParams;

  let conversations: Conversation[] = [];
  let error: string | null = null;

  try {
    const response = await fetchConversations({ q, tag });
    if (response.success) {
      conversations = response.data.conversations;
    } else {
      error = response.error.message;
    }
  } catch {
    // Firebaseが未設定の場合などは空配列で表示
    // エラー詳細はサーバーログで確認可能なため、ここではユーザーに空一覧を表示
    error = null;
  }

  // 対話に含まれるユニークなタグを抽出（フィルタUI用）
  const allTags = [...new Set(conversations.flatMap((c) => c.tags))].sort();

  return (
    <div
      className="flex h-full flex-col gap-6 px-12 py-10"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      <Header
        title="対話一覧"
        subtitle="LLMとの対話を、資産に変える"
        actions={
          <Suspense>
            <SearchBar />
          </Suspense>
        }
      />

      {/* タグフィルタ */}
      <Suspense>
        <TagFilter tags={allTags} />
      </Suspense>

      {/* アクティブフィルタ表示 */}
      {(q || tag) && (
        <p className="text-sm" style={{ color: 'var(--gray-700)' }}>
          {conversations.length}件の結果
          {q && <span>（検索: &quot;{q}&quot;）</span>}
          {tag && <span>（タグ: {tag}）</span>}
        </p>
      )}

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
