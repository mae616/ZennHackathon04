/**
 * @fileoverview Content Script - LLM対話ページのDOM解析エントリポイント
 *
 * Background Scriptからのメッセージを受信し、対話をキャプチャして返す。
 * プラットフォーム判定とパーサー呼び出しを統合する。
 *
 * @remarks
 * - Gemini: gemini.google.com/* にマッチ
 * - ChatGPT/Claude: 将来対応予定（現在はスタブ実装）
 */

import { detectPlatform, isSupportedPlatform } from '@/utils/platform';
import { extractConversation, type ParseResult } from '@/lib/parsers';
import type { SourcePlatform } from '@zenn-hackathon04/shared';

/**
 * Background Scriptから送信されるメッセージの型定義
 */
interface CaptureMessage {
  type: 'CAPTURE_CONVERSATION';
}

/**
 * Content Scriptからの応答型定義
 */
interface CaptureResponse {
  success: boolean;
  platform: SourcePlatform | null;
  data?: ParseResult;
  error?: string;
}

/**
 * メッセージがキャプチャリクエストかどうかを判定する型ガード
 *
 * @param message - 受信したメッセージ
 * @returns CAPTUREs_CONVERSATIONメッセージならtrue
 */
function isCaptureMessage(message: unknown): message is CaptureMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type: unknown }).type === 'CAPTURE_CONVERSATION'
  );
}

/**
 * 対話キャプチャ処理を実行する
 *
 * @returns キャプチャ結果
 */
function handleCaptureRequest(): CaptureResponse {
  const currentUrl = window.location.href;
  const platform = detectPlatform(currentUrl);

  // サポート対象外のプラットフォーム
  if (!platform) {
    return {
      success: false,
      platform: null,
      error: `サポートされていないプラットフォームです: ${currentUrl}`,
    };
  }

  // 対話を抽出
  const result = extractConversation(platform);

  if (!result.success) {
    return {
      success: false,
      platform,
      error: result.error,
    };
  }

  // 空のメッセージリストは失敗扱い
  if (result.messages.length === 0) {
    return {
      success: false,
      platform,
      error:
        '対話メッセージが見つかりませんでした。対話が開始されているか確認してください。',
    };
  }

  return {
    success: true,
    platform,
    data: result,
  };
}

/**
 * Content Scriptのメインエントリポイント
 *
 * - Geminiページ（gemini.google.com/*）で実行
 * - Background Scriptからのメッセージを待機
 * - CAPTURE_CONVERSATIONメッセージ受信時に対話を抽出して返す
 */
export default defineContentScript({
  // Geminiのマッチパターン
  // 将来的にChatGPT/Claudeを追加する場合はここに追記
  matches: ['*://gemini.google.com/*'],

  /**
   * Content Scriptの初期化処理
   */
  main() {
    const currentUrl = window.location.href;

    // 起動ログ（デバッグ用）
    console.log('[ThinkResume] Content Script loaded', {
      url: currentUrl,
      platform: detectPlatform(currentUrl),
      supported: isSupportedPlatform(currentUrl),
    });

    // Background Scriptからのメッセージを待機
    browser.runtime.onMessage.addListener(
      (
        message: unknown,
        _sender: browser.runtime.MessageSender,
        sendResponse: (response: CaptureResponse) => void
      ) => {
        // キャプチャリクエスト以外は無視
        if (!isCaptureMessage(message)) {
          return false;
        }

        console.log('[ThinkResume] Capture request received');

        // キャプチャ処理を実行
        const response = handleCaptureRequest();

        console.log('[ThinkResume] Capture result', {
          success: response.success,
          platform: response.platform,
          messageCount: response.data?.success
            ? response.data.messages.length
            : 0,
        });

        // 応答を返す
        sendResponse(response);

        // 同期的に応答を返したことを示す
        return true;
      }
    );
  },
});
