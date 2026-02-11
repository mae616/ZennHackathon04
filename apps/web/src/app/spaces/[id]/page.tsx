/**
 * @fileoverview スペース詳細ページ
 *
 * スペースの詳細（含まれる対話・メモ・洞察・統合コンテキスト対話）を表示する。
 * Server Componentとして実装し、APIからスペースデータを取得する。
 *
 * RDD参照:
 * - doc/input/rdd.md §スペース機能（Web）
 */
import { notFound } from 'next/navigation';
import type { Space } from '@zenn-hackathon04/shared';
import { fetchSpace } from '@/lib/api';
import { SpaceDetailContent } from '@/components/spaces/SpaceDetailContent';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * スペース詳細ページコンポーネント
 *
 * Server Componentとして実装。APIからスペースデータを取得し、
 * 存在しない場合は404ページを表示する。
 *
 * @param params - ルートパラメータ（id: スペースID）
 */
export default async function SpaceDetailPage({ params }: Props) {
  const { id } = await params;

  let space: Space | null = null;

  try {
    const response = await fetchSpace(id);
    if (response.success) {
      space = response.data;
    }
  } catch (err) {
    // APIエラーの場合は404として扱う（サーバーログで詳細確認）
    console.error('Failed to fetch space:', err);
  }

  if (!space) {
    notFound();
  }

  return (
    <div
      className="flex h-full flex-col px-10 py-8"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      <SpaceDetailContent space={space} />
    </div>
  );
}
