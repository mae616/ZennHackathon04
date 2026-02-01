/**
 * @fileoverview ページヘッダーコンポーネント
 *
 * ページタイトル、サブタイトル、検索UIを表示する。
 * デザイン: thinkresume.pen の pageHeader を参照
 */
import { Search } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
}

/**
 * ページヘッダーコンポーネント
 *
 * @param title - ページタイトル
 * @param subtitle - サブタイトル（省略可）
 * @param showSearch - 検索UIを表示するか（デフォルト: false）
 */
export function Header({ title, subtitle, showSearch = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between">
      {/* 左側: タイトル・サブタイトル */}
      <div className="flex flex-col gap-1">
        <h1
          className="text-3xl font-semibold"
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            color: 'var(--black-primary)',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--gray-700)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* 右側: 検索ボタン */}
      {showSearch && (
        <button
          type="button"
          className="flex items-center gap-2 rounded border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--gray-700)',
          }}
        >
          <Search className="h-4 w-4" />
          検索
        </button>
      )}
    </header>
  );
}
