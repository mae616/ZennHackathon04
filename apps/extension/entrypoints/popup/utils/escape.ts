/**
 * @fileoverview HTMLエスケープユーティリティ
 *
 * XSS対策のためのHTMLエスケープ処理を提供する。
 * ユーザー入力をDOMに挿入する際に使用する。
 */

/**
 * HTMLエスケープ処理
 *
 * 文字列内の特殊文字（<, >, &, ", '）をHTMLエンティティに変換する。
 * XSS攻撃を防ぐため、ユーザー入力をinnerHTMLに挿入する前に必ず使用する。
 *
 * @param text - エスケープする文字列
 * @returns エスケープされた文字列
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script>';
 * const safe = escapeHtml(userInput);
 * // safe = '&lt;script&gt;alert("xss")&lt;/script&gt;'
 * ```
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
