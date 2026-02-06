/**
 * Vertex AI (Gemini) 連携モジュール
 *
 * Gemini APIとの通信を行うユーティリティ。
 * 対話コンテキストを渡して思考再開のためのAI応答を取得する。
 *
 * @remarks
 * - サーバーサイド専用（Next.js API Routes / Server Components）
 * - Firebase Admin SDKと同じサービスアカウント認証を使用
 * - ストリーミングレスポンス対応
 */
import {
  VertexAI,
  type GenerateContentRequest,
  type Content,
  HarmCategory,
  HarmBlockThreshold,
} from '@google-cloud/vertexai';

// 型定義はtypes.tsから再エクスポート
export type { GeminiMessage, ThinkResumeContext } from './types';
export { generateGreetingMessage } from './types';
import type { GeminiMessage, ThinkResumeContext } from './types';

/** Vertex AI クライアントのシングルトンインスタンス */
let vertexAI: VertexAI | null = null;

/**
 * Vertex AI クライアントを初期化する
 *
 * 既に初期化済みの場合は既存のインスタンスを返す。
 * GCP_PROJECT_ID 環境変数が必須。
 *
 * @returns 初期化された VertexAI インスタンス
 * @throws 環境変数が未設定の場合
 */
function getVertexAI(): VertexAI {
  if (vertexAI) {
    return vertexAI;
  }

  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

  if (!projectId) {
    throw new Error(
      'Vertex AI の初期化に必要な環境変数が設定されていません。' +
        'GCP_PROJECT_ID を確認してください。'
    );
  }

  vertexAI = new VertexAI({
    project: projectId,
    location,
  });

  return vertexAI;
}

/**
 * Gemini モデルの安全性設定
 *
 * 思考再開ツールとして一般的な対話を想定するため、
 * デフォルトの閾値を使用（過度にブロックしない）
 */
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * 思考再開用のシステムプロンプトを生成する
 *
 * @param context - 思考再開のコンテキスト
 * @returns システムプロンプト文字列
 */
function buildSystemPrompt(context: ThinkResumeContext): string {
  const parts: string[] = [
    'あなたは思考再開を支援するAIアシスタントです。',
    'ユーザーが以前に行った対話の内容を踏まえて、思考の継続を手伝ってください。',
    '',
    '## 前回の対話内容',
    context.conversationSummary,
  ];

  if (context.title) {
    parts.push('', `## 対話のテーマ: ${context.title}`);
  }

  if (context.note) {
    parts.push('', '## ユーザーのメモ・要件', context.note);
  }

  parts.push(
    '',
    '## 指示',
    '- 前回の対話内容とメモを踏まえて、ユーザーの質問に丁寧に回答してください。',
    '- 必要に応じて、前回の議論のポイントを振り返りながら説明してください。',
    '- ユーザーが新しい方向に議論を進めたい場合は、柔軟に対応してください。'
  );

  return parts.join('\n');
}

/**
 * Gemini とストリーミングでチャットする
 *
 * 対話コンテキストとメッセージ履歴を元に、Gemini の応答をストリーミングで取得する。
 *
 * @param context - 思考再開のコンテキスト
 * @param messages - これまでのメッセージ履歴
 * @param userMessage - ユーザーの新しいメッセージ
 * @yields Gemini からの応答テキスト（チャンク単位）
 * @throws API呼び出しに失敗した場合
 *
 * @example
 * ```typescript
 * const context = {
 *   conversationSummary: "前回の対話内容...",
 *   note: "メモ",
 *   title: "React設計について"
 * };
 *
 * for await (const chunk of streamChat(context, [], "前回の続きを教えて")) {
 *   process.stdout.write(chunk);
 * }
 * ```
 */
export async function* streamChat(
  context: ThinkResumeContext,
  messages: GeminiMessage[],
  userMessage: string
): AsyncGenerator<string, void, unknown> {
  const vertexAI = getVertexAI();

  const model = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
    },
  });

  // システムプロンプトをコンテンツとして構築
  const systemInstruction = buildSystemPrompt(context);

  // メッセージ履歴をVertex AI形式に変換
  const contents: Content[] = messages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // 新しいユーザーメッセージを追加
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const request: GenerateContentRequest = {
    contents,
    systemInstruction: {
      role: 'user',
      parts: [{ text: systemInstruction }],
    },
  };

  try {
    const streamingResult = await model.generateContentStream(request);

    for await (const chunk of streamingResult.stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    // エラーの種類に応じてメッセージを整形
    if (error instanceof Error) {
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error(
          'Vertex AI APIへのアクセスが拒否されました。サービスアカウントの権限を確認してください。'
        );
      }
      if (error.message.includes('RESOURCE_EXHAUSTED')) {
        throw new Error(
          'Vertex AI APIのレート制限に達しました。しばらく待ってから再試行してください。'
        );
      }
      if (error.message.includes('NOT_FOUND')) {
        throw new Error(
          'Vertex AI APIが見つかりません。GCPプロジェクトでVertex AI APIが有効化されているか確認してください。'
        );
      }
    }
    throw error;
  }
}

/**
 * Gemini と非ストリーミングでチャットする
 *
 * ストリーミングが不要な場合（短い応答を期待する場合など）に使用。
 *
 * @param context - 思考再開のコンテキスト
 * @param messages - これまでのメッセージ履歴
 * @param userMessage - ユーザーの新しいメッセージ
 * @returns Gemini からの応答テキスト全文
 * @throws API呼び出しに失敗した場合
 */
export async function chat(
  context: ThinkResumeContext,
  messages: GeminiMessage[],
  userMessage: string
): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of streamChat(context, messages, userMessage)) {
    chunks.push(chunk);
  }
  return chunks.join('');
}

/**
 * Vertex AI が正しく設定されているかを検証する
 *
 * 環境変数の存在確認のみを行う（実際のAPI呼び出しは行わない）。
 *
 * @returns 設定が有効な場合true
 */
export function isVertexAIConfigured(): boolean {
  return !!process.env.GCP_PROJECT_ID;
}
