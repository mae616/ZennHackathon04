/**
 * @fileoverview タグフィルタコンポーネント
 *
 * 対話一覧で使用するタグバッジ群。
 * タグクリックでURLクエリパラメータ(?tag=xxx)を更新し、フィルタリングをトリガーする。
 * 同じタグを再クリックでフィルタ解除。
 */
'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tag } from 'lucide-react';

interface TagFilterProps {
  /** 表示するタグ一覧（重複なし） */
  tags: string[];
}

/**
 * タグフィルタコンポーネント
 *
 * @param tags - 表示するタグの配列
 */
export function TagFilter({ tags }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag');

  /** タグクリック時にURLクエリパラメータを切り替える */
  const handleTagClick = useCallback(
    (tag: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (activeTag === tag) {
        // 同じタグを再クリック → フィルタ解除
        params.delete('tag');
      } else {
        params.set('tag', tag);
      }
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : '/');
    },
    [router, searchParams, activeTag]
  );

  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Tag
        className="h-3.5 w-3.5 flex-shrink-0"
        style={{ color: 'var(--gray-500)' }}
        aria-hidden="true"
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="タグフィルタ">
        {tags.map((tag) => {
          const isActive = activeTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              aria-pressed={isActive}
              className="rounded-full px-2.5 py-0.5 text-xs transition-colors hover:opacity-80"
              style={{
                backgroundColor: isActive ? 'var(--red-primary)' : 'var(--bg-surface)',
                color: isActive ? 'white' : 'var(--gray-700)',
                border: isActive ? '1px solid var(--red-primary)' : '1px solid var(--border)',
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
