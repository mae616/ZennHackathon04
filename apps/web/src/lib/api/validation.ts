/**
 * @fileoverview API入力バリデーション共通ユーティリティ
 *
 * API Routesで使用するパラメータ検証の共通関数を提供する。
 */

/**
 * Firestore Document IDのフォーマットを検証する
 *
 * Firestoreの制約に基づくバリデーション:
 * - 空文字でない
 * - 1〜1500文字以内（Firestoreは1500バイトだが、ASCII IDを想定し文字数で簡易チェック）
 * - スラッシュ（/）を含まない
 * - 単一のピリオド（.）またはダブルピリオド（..）でない
 * - __.*__の形式でない（予約済み）
 *
 * @param id - 検証対象のID
 * @returns 有効なIDの場合true
 */
export function isValidDocumentId(id: string): boolean {
  if (!id || id.length === 0 || id.length > 1500) {
    return false;
  }
  if (id.includes('/')) {
    return false;
  }
  if (id === '.' || id === '..') {
    return false;
  }
  if (/^__.*__$/.test(id)) {
    return false;
  }
  return true;
}
