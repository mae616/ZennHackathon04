/**
 * @fileoverview Gemini (gemini.google.com) DOM解析パーサー
 * GeminiのDOM構造からユーザー・アシスタント間の対話を抽出する
 *
 * @remarks
 * GeminiのDOM構造は変更される可能性があるため、セレクタは定数として分離し
 * 変更時の対応を容易にしている
 */

import type { Message, MessageRole } from '@zenn-hackathon04/shared';
import type { ParseResult } from './index';

/**
 * Gemini DOM解析用セレクタ定義
 * DOM構造変更時はここを更新する
 *
 * @remarks
 * 2024年時点のGemini UIを基準としたセレクタ
 * Googleは頻繁にUI更新を行うため、動作しなくなった場合は
 * 実際のDOMを調査して更新する必要がある
 */
const GEMINI_SELECTORS = {
  /** 対話ターン全体のコンテナ（ユーザー入力 + AI応答のペア） */
  conversationTurn: 'model-response, user-query',

  /** ユーザーの入力メッセージ要素 */
  userQuery: 'user-query',

  /** AIの応答メッセージ要素 */
  modelResponse: 'model-response',

  /** メッセージ本文を含む要素（マークダウンレンダリング部分） */
  messageContent: '.message-content, .response-content, [class*="text"]',

  /** ページタイトル（対話タイトルとして使用） */
  pageTitle: 'title',
} as const;

/**
 * 一意なIDを生成する
 * crypto.randomUUID が利用可能な環境ではそれを使用し、
 * そうでない場合はタイムスタンプベースのIDを生成
 *
 * @returns 一意な識別子文字列
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック: タイムスタンプ + ランダム値
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 要素からテキストコンテンツを抽出する
 * 余分な空白を正規化し、トリミングを行う
 *
 * @param element - テキスト抽出対象の要素
 * @returns 正規化されたテキスト、またはnull
 */
function extractTextContent(element: Element | null): string | null {
  if (!element) return null;

  // innerTextを優先（CSSで非表示のものを除外）
  const text = element.textContent || '';

  // 連続する空白を単一スペースに正規化
  return text.replace(/\s+/g, ' ').trim() || null;
}

/**
 * DOM要素からメッセージロールを判定する
 *
 * @param element - 判定対象の要素
 * @returns メッセージロール
 */
function determineRole(element: Element): MessageRole {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'user-query') {
    return 'user';
  }

  if (tagName === 'model-response') {
    return 'assistant';
  }

  // data属性やクラス名でのフォールバック判定
  const dataRole = element.getAttribute('data-role');
  if (dataRole === 'user') return 'user';
  if (dataRole === 'assistant' || dataRole === 'model') return 'assistant';

  // デフォルトはassistant
  return 'assistant';
}

/**
 * Geminiページから対話メッセージを抽出するメイン関数
 *
 * @returns 解析結果（成功時はメッセージ配列、失敗時はエラー情報）
 *
 * @example
 * ```typescript
 * const result = parseGeminiConversation();
 * if (result.success) {
 *   console.log(`${result.messages.length}件のメッセージを抽出`);
 * } else {
 *   console.error('解析失敗:', result.error);
 * }
 * ```
 */
export function parseGeminiConversation(): ParseResult {
  try {
    // 対話ターン要素を取得（出現順でソート）
    const turnElements = document.querySelectorAll(
      GEMINI_SELECTORS.conversationTurn
    );

    if (turnElements.length === 0) {
      return {
        success: false,
        error:
          '対話要素が見つかりませんでした。Geminiの対話ページを開いているか確認してください。',
      };
    }

    const messages: Message[] = [];
    const now = new Date().toISOString();

    // 各ターン要素からメッセージを抽出
    for (const element of turnElements) {
      const role = determineRole(element);
      const content = extractTextContent(element);

      // 空のメッセージはスキップ
      if (!content) continue;

      messages.push({
        id: generateId(),
        role,
        content,
        timestamp: now, // 実際のタイムスタンプはDOM上に存在しないためキャプチャ時刻を使用
      });
    }

    // タイトル抽出（ページタイトルまたは最初のユーザーメッセージを使用）
    const pageTitle = document.title || null;
    const title =
      pageTitle && pageTitle !== 'Gemini'
        ? pageTitle.replace(' - Gemini', '').trim()
        : messages.find((m) => m.role === 'user')?.content.slice(0, 50) || null;

    return {
      success: true,
      messages,
      title,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '不明なエラーが発生しました';
    return {
      success: false,
      error: `Gemini対話の解析中にエラーが発生しました: ${errorMessage}`,
    };
  }
}
