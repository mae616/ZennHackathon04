/**
 * @fileoverview URL→SourcePlatform判定ロジック
 * 対象LLMプラットフォームのURLパターンからプラットフォームを特定する
 */

import type { SourcePlatform } from '@zenn-hackathon04/shared';

/**
 * サポート対象プラットフォームのURLパターン定義
 * 将来的なプラットフォーム追加に備え、定数として分離
 */
const PLATFORM_URL_PATTERNS: ReadonlyArray<{
  platform: SourcePlatform;
  hostPatterns: readonly RegExp[];
}> = [
  {
    platform: 'gemini',
    hostPatterns: [/^gemini\.google\.com$/],
  },
  {
    platform: 'chatgpt',
    hostPatterns: [/^chat\.openai\.com$/, /^chatgpt\.com$/],
  },
  {
    platform: 'claude',
    hostPatterns: [/^claude\.ai$/],
  },
] as const;

/**
 * URLからプラットフォームを判定する
 *
 * @param url - 判定対象のURL文字列
 * @returns 検出されたプラットフォーム、または判定不可の場合はnull
 *
 * @example
 * ```typescript
 * const platform = detectPlatform('https://gemini.google.com/app');
 * // => 'gemini'
 *
 * const unknown = detectPlatform('https://example.com');
 * // => null
 * ```
 */
export function detectPlatform(url: string): SourcePlatform | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    for (const { platform, hostPatterns } of PLATFORM_URL_PATTERNS) {
      for (const pattern of hostPatterns) {
        if (pattern.test(hostname)) {
          return platform;
        }
      }
    }

    return null;
  } catch {
    // 無効なURL形式の場合
    return null;
  }
}

/**
 * 現在のページがサポート対象プラットフォームかどうかを判定する
 *
 * @param url - 判定対象のURL文字列
 * @returns サポート対象ならtrue、それ以外はfalse
 */
export function isSupportedPlatform(url: string): boolean {
  return detectPlatform(url) !== null;
}
