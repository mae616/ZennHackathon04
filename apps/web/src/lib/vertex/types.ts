/**
 * @fileoverview Vertex AI / Gemini 関連の型定義
 *
 * クライアントコンポーネントからも参照可能な型定義を提供する。
 * サーバーサイド専用の機能は gemini.ts に分離。
 */

/**
 * Gemini への入力メッセージ形式
 */
export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * 思考再開用のコンテキスト
 */
export interface ThinkResumeContext {
  /** 保存された対話履歴の要約または全文 */
  conversationSummary: string;
  /** ユーザーのメモ・要件 */
  note?: string;
  /** 対話のタイトル（テーマの参考情報） */
  title?: string;
}

/**
 * 初回挨拶メッセージを生成する
 *
 * 思考再開セッション開始時に Gemini が最初に送るメッセージ。
 * クライアントサイドで実行可能。
 *
 * @param context - 思考再開のコンテキスト
 * @returns 初回挨拶メッセージ
 */
export function generateGreetingMessage(context: ThinkResumeContext): string {
  const title = context.title || '前回の対話';
  return (
    `「${title}」の内容を確認しました。` +
    '前回の議論を踏まえて、何かお手伝いできることはありますか？\n\n' +
    '例えば:\n' +
    '- 前回の議論のポイントを整理する\n' +
    '- 特定のトピックについて深掘りする\n' +
    '- 新しい視点や疑問について議論する\n\n' +
    'お気軽にお聞きください。'
  );
}
