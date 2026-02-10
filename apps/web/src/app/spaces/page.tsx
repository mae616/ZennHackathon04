/**
 * @fileoverview スペース一覧ページ
 *
 * 作成済みスペースの一覧を表示するページ。
 * Server Componentとして実装し、APIから直接データを取得する。
 */
import type { Space } from '@zenn-hackathon04/shared';
import { Header } from '@/components/layout/Header';
import { SpaceList } from '@/components/spaces/SpaceList';
import { fetchSpaces } from '@/lib/api';

/**
 * スペース一覧ページコンポーネント
 *
 * APIからスペース一覧を取得し、カードリストとして表示する。
 * エラー時はエラーメッセージを表示。
 */
export default async function SpacesPage() {
  let spaces: Space[] = [];
  let error: string | null = null;

  try {
    const response = await fetchSpaces();
    if (response.success) {
      spaces = response.data.spaces;
    } else {
      error = response.error.message;
    }
  } catch (err) {
    // Firebaseが未設定の場合などは空配列で表示
    // エラー詳細はサーバーログで確認可能
    console.error('Failed to fetch spaces:', err);
    error = null;
  }

  return (
    <div
      className="flex h-full flex-col gap-8 px-12 py-10"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      <Header
        title="スペース"
        subtitle="複数の対話を統合して思考を継続"
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
        <SpaceList spaces={spaces} />
      )}
    </div>
  );
}
