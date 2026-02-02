/**
 * @fileoverview 日時フォーマット用ユーティリティ
 *
 * 対話カードや詳細ヘッダーで使用する日時表示の共通関数を提供する。
 */

/**
 * 日時を表示用にフォーマットする
 *
 * @param dateString - ISO 8601形式の日時文字列
 * @returns フォーマット済み日時（例: 2024/01/15 14:30）
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
