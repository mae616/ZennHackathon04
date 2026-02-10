/**
 * @fileoverview API呼び出しユーティリティ
 *
 * 内部APIへのリクエストを行うためのユーティリティ関数群。
 * Server Componentsから直接呼び出し可能。
 */
import type {
  ListConversationsResponse,
  GetConversationResponse,
  ListSpacesResponse,
  GetSpaceResponse,
  ApiFailure,
} from '@zenn-hackathon04/shared';

/**
 * APIのベースURL（Server Components専用）
 * NOTE: サーバーサイドでのみ使用するため、NEXT_PUBLIC_ではなくAPI_URLを使用
 */
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * 対話一覧を取得する
 *
 * @param cursor - ページネーションカーソル（省略時は先頭から）
 * @returns 対話一覧レスポンス
 * @throws ネットワークエラーまたはAPIエラー
 */
export async function fetchConversations(
  cursor?: string
): Promise<ListConversationsResponse | ApiFailure> {
  const url = new URL('/api/conversations', API_BASE_URL);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url.toString(), {
    cache: 'no-store', // 常に最新データを取得
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.status}`);
  }

  return response.json();
}

/**
 * 対話詳細を取得する
 *
 * @param id - 対話ID
 * @returns 対話詳細レスポンス
 * @throws ネットワークエラーまたはAPIエラー
 */
export async function fetchConversation(
  id: string
): Promise<GetConversationResponse | ApiFailure> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversation: ${response.status}`);
  }

  return response.json();
}

/**
 * スペース一覧を取得する
 *
 * @param cursor - ページネーションカーソル（省略時は先頭から）
 * @returns スペース一覧レスポンス
 * @throws ネットワークエラーまたはAPIエラー
 */
export async function fetchSpaces(
  cursor?: string
): Promise<ListSpacesResponse | ApiFailure> {
  const url = new URL('/api/spaces', API_BASE_URL);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url.toString(), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch spaces: ${response.status}`);
  }

  return response.json();
}

/**
 * スペース詳細を取得する
 *
 * @param id - スペースID
 * @returns スペース詳細レスポンス
 * @throws ネットワークエラーまたはAPIエラー
 */
export async function fetchSpace(
  id: string
): Promise<GetSpaceResponse | ApiFailure> {
  const response = await fetch(`${API_BASE_URL}/api/spaces/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch space: ${response.status}`);
  }

  return response.json();
}
