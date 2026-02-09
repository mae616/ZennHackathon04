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
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 現在日時を追記用ヘッダー形式でフォーマットする
 * RDD参照: §メモ・要件の編集機能「YYYY/MM/DD HH:MM 追記」
 *
 * @returns 追記ヘッダー文字列（例: 2024/01/15 14:30 追記）
 */
export function formatAppendHeader(): string {
  const now = new Date();
  const dateStr = now.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr} 追記`;
}
