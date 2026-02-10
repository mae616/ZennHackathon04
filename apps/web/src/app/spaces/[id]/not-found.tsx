/**
 * @fileoverview スペースが見つからない場合の404ページ
 *
 * 指定されたIDのスペースが存在しない場合に表示する。
 */
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * 404 Not Found ページコンポーネント
 *
 * スペースが見つからない場合に表示し、一覧ページへの導線を提供する。
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h1
        className="text-2xl font-semibold"
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          color: 'var(--black-primary)',
        }}
      >
        スペースが見つかりません
      </h1>
      <p className="text-sm" style={{ color: 'var(--gray-700)' }}>
        指定されたスペースは存在しないか、削除された可能性があります。
      </p>
      <Link
        href="/spaces"
        className="mt-2 flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
        style={{ color: 'var(--red-primary)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        スペース一覧に戻る
      </Link>
    </div>
  );
}
