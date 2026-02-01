/**
 * @fileoverview パーサー共通インターフェースとファクトリ
 * 各プラットフォームのDOM解析器を統一インターフェースで管理する
 */

import type { Message, SourcePlatform } from '@zenn-hackathon04/shared';
import { parseGeminiConversation } from './gemini';

/**
 * DOM解析結果を表す型
 * 解析成功時はメッセージ配列、失敗時はエラー情報を含む
 */
export type ParseResult =
  | { success: true; messages: Message[]; title: string | null }
  | { success: false; error: string };

/**
 * プラットフォーム別パーサーの共通インターフェース
 * 各プラットフォームのパーサーはこのインターフェースを実装する
 */
export interface ConversationParser {
  /**
   * DOMから対話メッセージを抽出する
   * @returns 解析結果（成功時はメッセージ配列、失敗時はエラー情報）
   */
  parse(): ParseResult;
}

/**
 * プラットフォームに応じたパーサーを取得する
 *
 * @param platform - 対象プラットフォーム
 * @returns パーサーインスタンス
 * @throws サポートされていないプラットフォームの場合はエラー
 *
 * @example
 * ```typescript
 * const parser = getParser('gemini');
 * const result = parser.parse();
 * if (result.success) {
 *   console.log('Messages:', result.messages);
 * }
 * ```
 */
export function getParser(platform: SourcePlatform): ConversationParser {
  switch (platform) {
    case 'gemini':
      return {
        parse: parseGeminiConversation,
      };

    case 'chatgpt':
      // ChatGPT対応は計画中 - スタブとして空配列を返す
      return {
        parse: () => ({
          success: true,
          messages: [],
          title: null,
        }),
      };

    case 'claude':
      // Claude対応は計画中 - スタブとして空配列を返す
      return {
        parse: () => ({
          success: true,
          messages: [],
          title: null,
        }),
      };

    default: {
      // TypeScriptの網羅性チェック
      const _exhaustiveCheck: never = platform;
      throw new Error(`Unsupported platform: ${_exhaustiveCheck}`);
    }
  }
}

/**
 * 現在のページから対話を抽出する便利関数
 *
 * @param platform - 対象プラットフォーム
 * @returns 解析結果
 */
export function extractConversation(platform: SourcePlatform): ParseResult {
  const parser = getParser(platform);
  return parser.parse();
}
