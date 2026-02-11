/**
 * @fileoverview スペース一覧コンポーネント
 *
 * スペースカードのリストを表示する。
 * 空の場合は案内メッセージを表示。
 * 「+ 新規スペース」ボタンと作成モーダルを含む。
 */
'use client';

import { useState } from 'react';
import type { Space } from '@zenn-hackathon04/shared';
import { SpaceCard } from './SpaceCard';
import { CreateSpaceModal } from './CreateSpaceModal';
import { LayoutGrid, Plus } from 'lucide-react';

interface SpaceListProps {
  spaces: Space[];
}

/**
 * スペース一覧コンポーネント
 *
 * @param spaces - 表示するスペースの配列
 */
export function SpaceList({ spaces }: SpaceListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      {/* 新規作成ボタン */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-sm px-4 py-2 text-sm text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--red-primary)' }}
        >
          <Plus className="h-4 w-4" />
          新規スペース
        </button>
      </div>

      {/* スペースリスト */}
      {spaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <LayoutGrid
            className="h-12 w-12"
            style={{ color: 'var(--gray-400)' }}
          />
          <div className="text-center">
            <p
              className="text-lg font-medium"
              style={{ color: 'var(--black-primary)' }}
            >
              まだスペースがありません
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--gray-700)' }}>
              複数の対話をグループ化して、統合コンテキストで思考を継続できます
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      )}

      {/* 作成モーダル */}
      <CreateSpaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
