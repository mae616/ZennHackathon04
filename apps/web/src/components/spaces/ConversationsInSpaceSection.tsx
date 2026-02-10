/**
 * @fileoverview スペース内の対話一覧セクション
 *
 * スペースに含まれる対話をコンパクトなリストで表示する。
 * 各対話はタイトル・ソース・日時を表示し、詳細ページへのリンクを提供する。
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Conversation } from '@zenn-hackathon04/shared';
import { MessageSquare, Loader2, AlertCircle, RotateCcw, ExternalLink } from 'lucide-react';
import { SourceBadge } from '@/components/conversations/SourceBadge';
import { formatDate } from '@/lib/utils/date';

interface ConversationsInSpaceSectionProps {
  /** スペースに含まれる対話IDの配列 */
  conversationIds: string[];
}

/**
 * スペース内の対話一覧セクション
 *
 * conversationIds から各対話をAPIで取得し、リスト表示する。
 *
 * @param conversationIds - 対話IDの配列
 */
export function ConversationsInSpaceSection({ conversationIds }: ConversationsInSpaceSectionProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  /** 部分的に取得失敗した対話の件数 */
  const [partialFailureCount, setPartialFailureCount] = useState(0);

  /** conversationIds をプリミティブ化して安定した依存配列に使用 */
  const conversationIdsKey = conversationIds.join(',');

  /** 対話データを取得する */
  const fetchConversations = useCallback(async () => {
    if (conversationIds.length === 0) {
      setConversations([]);
      setIsLoading(false);
      setHasError(false);
      setPartialFailureCount(0);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);
      setPartialFailureCount(0);

      // 個別に取得（バッチ取得APIは未実装のため個別fetch）
      // 同時リクエスト数をチャンク化で制限（ブラウザ接続上限 + サーバー負荷対策）
      const CHUNK_SIZE = 5;
      const results: PromiseSettledResult<Conversation | null>[] = [];
      for (let i = 0; i < conversationIds.length; i += CHUNK_SIZE) {
        const chunk = conversationIds.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.allSettled(
          chunk.map(async (id) => {
            const response = await fetch(`/api/conversations/${id}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.success ? data.data as Conversation : null;
          })
        );
        results.push(...chunkResults);
      }

      // 部分的取得失敗の検出（W9対応）
      const failedCount = results.filter(
        (r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === null)
      ).length;
      setPartialFailureCount(failedCount);

      const validConversations = results
        .filter((r): r is PromiseFulfilledResult<Conversation | null> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((c): c is Conversation => c !== null);

      setConversations(validConversations);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- conversationIdsKey でプリミティブ比較（配列参照の不安定化を回避）
  }, [conversationIdsKey]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <section
      className="flex flex-col gap-3 rounded-sm p-6"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
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
            含まれる対話
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
          {isLoading ? '...' : `${conversations.length}件`}
        </span>
      </div>

      {/* 部分的取得失敗の通知 */}
      {!hasError && partialFailureCount > 0 && (
        <div
          className="flex items-center gap-2 rounded-sm px-3 py-2 text-xs"
          style={{
            backgroundColor: '#FEF9C3',
            color: '#854D0E',
          }}
        >
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {conversationIds.length}件中{partialFailureCount}件の対話の取得に失敗しました
        </div>
      )}

      {/* エラー表示 */}
      {hasError && (
        <div
          className="flex items-center justify-between rounded-sm p-4"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--red-primary)',
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" style={{ color: 'var(--red-primary)' }} />
            <span className="text-sm" style={{ color: 'var(--red-primary)' }}>
              対話の取得に失敗しました
            </span>
          </div>
          <button
            type="button"
            onClick={fetchConversations}
            className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors hover:opacity-70"
            style={{ color: 'var(--red-primary)' }}
          >
            <RotateCcw className="h-3 w-3" />
            再試行
          </button>
        </div>
      )}

      {/* 対話リスト */}
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
      ) : !hasError && conversations.length === 0 ? (
        <div
          className="rounded-sm p-4 text-center text-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--gray-700)',
          }}
        >
          まだ対話が追加されていません
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/conversations/${conversation.id}`}
              className="group flex items-center justify-between rounded-sm p-3 transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex flex-1 items-center gap-3">
                <div className="flex flex-1 flex-col gap-0.5">
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--black-primary)' }}
                  >
                    {conversation.title}
                  </span>
                  <time
                    className="text-xs"
                    style={{ color: 'var(--gray-500)' }}
                    dateTime={conversation.updatedAt}
                  >
                    {formatDate(conversation.updatedAt)}
                  </time>
                </div>
                <SourceBadge source={conversation.source} />
              </div>
              <ExternalLink
                className="ml-2 h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: 'var(--gray-500)' }}
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
