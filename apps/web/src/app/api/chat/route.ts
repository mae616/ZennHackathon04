/**
 * チャットAPIエンドポイント
 *
 * POST /api/chat
 * - 対話コンテキストを元にGeminiとストリーミングチャットを行う
 * - conversationIdから対話を取得し、コンテキストを構築
 * - ユーザーメッセージに対するGeminiの応答をストリーミングで返す
 *
 * RDD参照:
 * - doc/input/rdd.md §思考再開機能
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Conversation } from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';
import {
  streamChat,
  type GeminiMessage,
  type ThinkResumeContext,
} from '@/lib/vertex/gemini';
import { createClientErrorResponse, createServerErrorResponse } from '@/lib/api/errors';

/**
 * チャットリクエストのスキーマ
 */
const ChatRequestSchema = z.object({
  /** 対話ID（コンテキスト取得用） */
  conversationId: z.string().min(1),
  /** ユーザーのメッセージ */
  userMessage: z.string().min(1),
  /** これまでのGeminiとのチャット履歴 */
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
      })
    )
    .default([]),
});

/**
 * 対話履歴からコンテキスト用の要約を生成する
 *
 * @param conversation - 保存された対話
 * @returns 要約テキスト
 */
function buildConversationSummary(conversation: Conversation): string {
  return conversation.messages
    .map((msg) => {
      const role = msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'AI' : 'System';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');
}

/**
 * ストリーミングチャットエンドポイント
 *
 * @param request - POSTリクエスト（conversationId, userMessage, chatHistory）
 * @returns ストリーミングレスポンス（text/event-stream）
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse | Response> {
  try {
    // リクエストボディのパース（JSON構文エラーを個別ハンドリング）
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createClientErrorResponse(400, 'INVALID_JSON', '不正なJSON形式です');
    }

    const parseResult = ChatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return createClientErrorResponse(
        400,
        'VALIDATION_ERROR',
        'リクエストの形式が不正です',
        { fieldErrors: parseResult.error.flatten().fieldErrors } as Record<string, unknown>
      );
    }

    const { conversationId, userMessage, chatHistory } = parseResult.data;

    // 対話データを取得
    const db = getDb();
    const docRef = db.collection('conversations').doc(conversationId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return createClientErrorResponse(404, 'NOT_FOUND', '指定された対話が見つかりません');
    }

    // NOTE: Firestoreのデータは保存時にZodで検証済みのため、型アサーションを使用
    const conversation: Conversation = {
      id: doc.id,
      ...doc.data(),
    } as Conversation;

    // messagesの存在チェック（データ破損への防御）
    if (!Array.isArray(conversation.messages)) {
      return createServerErrorResponse(
        new Error('conversation.messages is not an array'),
        'POST /api/chat (data integrity)'
      );
    }

    // 思考再開コンテキストを構築
    const context: ThinkResumeContext = {
      conversationSummary: buildConversationSummary(conversation),
      title: conversation.title,
      note: conversation.note,
    };

    // チャット履歴を変換
    const messages: GeminiMessage[] = chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // ストリーミングレスポンスを生成
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat(context, messages, userMessage)) {
            // Server-Sent Events形式でデータを送信
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          // 完了シグナル
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          // エラー発生時はエラーメッセージを送信してストリームを閉じる
          const errorMessage =
            error instanceof Error ? error.message : 'Gemini APIでエラーが発生しました';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return createServerErrorResponse(error, 'POST /api/chat');
  }
}
