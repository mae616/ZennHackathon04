/**
 * @fileoverview 対話検索バーコンポーネント
 *
 * タイトルで対話を検索する入力フィールド。
 * 入力値をURLクエリパラメータ(?q=xxx)に反映し、Server Componentの再取得をトリガーする。
 */
'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

/** デバウンス待機時間（ms） */
const DEBOUNCE_MS = 300;

/**
 * 検索バーコンポーネント
 *
 * デバウンス付きの入力で URLクエリパラメータを更新し、
 * Server Component のデータ再取得をトリガーする。
 */
export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** URLクエリパラメータを更新する */
  const updateUrl = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('q', value.trim());
      } else {
        params.delete('q');
      }
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : '/');
    },
    [router, searchParams]
  );

  /** 入力変更ハンドラ（デバウンス付き） */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => updateUrl(value), DEBOUNCE_MS);
    },
    [updateUrl]
  );

  /** 検索クリア */
  const handleClear = useCallback(() => {
    setQuery('');
    clearTimeout(debounceRef.current);
    updateUrl('');
  }, [updateUrl]);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: 'var(--gray-500)' }}
        aria-hidden="true"
      />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="タイトルで検索..."
        aria-label="対話を検索"
        className="w-64 rounded border py-2 pl-9 pr-8 text-sm outline-none transition-colors focus:ring-2 focus:ring-red-500/40"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--black-primary)',
        }}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="検索をクリア"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 transition-opacity hover:opacity-70"
        >
          <X className="h-3.5 w-3.5" style={{ color: 'var(--gray-500)' }} />
        </button>
      )}
    </div>
  );
}
