/**
 * チャットAPIエンドポイント
 *
 * POST /api/chat
 * - 対話またはスペースのコンテキストを元にGeminiとストリーミングチャットを行う
 * - conversationId または spaceId からデータを取得し、コンテキストを構築
 * - ユーザーメッセージに対するGeminiの応答をストリーミングで返す
 *
 * RDD参照:
 * - doc/input/rdd.md §思考再開機能
 * - doc/input/rdd.md §スペース機能（統合コンテキストで対話）
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Conversation, Space } from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';
import {
  streamChat,
  type GeminiMessage,
  type ThinkResumeContext,
} from '@/lib/vertex/gemini';
import { createClientErrorResponse, createServerErrorResponse } from '@/lib/api/errors';
import { isValidDocumentId } from '@/lib/api/validation';

/**
 * チャットリクエストのスキーマ
 *
 * conversationId または spaceId のいずれか一方を指定する。
 */
const ChatRequestSchema = z.object({
  /** 対話ID（コンテキスト取得用、spaceIdと排他） */
  conversationId: z.string().min(1).optional(),
  /** スペースID（統合コンテキスト取得用、conversationIdと排他） */
  spaceId: z.string().min(1).optional(),
  /** ユーザーのメッセージ（メモリ消費防止のため上限設定） */
  userMessage: z.string().min(1).max(10000),
  /** これまでのGeminiとのチャット履歴（メモリ・トークン消費防止のため上限設定） */
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string().max(10000),
      })
    )
    .max(50)
    .default([]),
}).refine(
  (data) => (data.conversationId !== undefined) !== (data.spaceId !== undefined),
  { message: 'conversationId または spaceId のいずれか一方を指定してください' }
);

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
 * 複数対話の統合コンテキストを構築する
 *
 * @param conversations - スペースに含まれる対話の配列
 * @returns 統合された要約テキスト
 */
function buildSpaceConversationSummary(conversations: Conversation[]): string {
  return conversations
    .map((conv, i) => {
      const header = `### 対話${i + 1}: ${conv.title}`;
      const messages = conv.messages
        .map((msg) => {
          const role = msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'AI' : 'System';
          return `${role}: ${msg.content}`;
        })
        .join('\n\n');
      return `${header}\n${messages}`;
    })
    .join('\n\n---\n\n');
}

/**
 * 単一対話からコンテキストを構築する
 */
async function buildConversationContext(
  conversationId: string
): Promise<{ context: ThinkResumeContext } | { error: NextResponse }> {
  if (!isValidDocumentId(conversationId)) {
    return { error: createClientErrorResponse(400, 'INVALID_ID_FORMAT', 'IDのフォーマットが不正です') };
  }

  const db = getDb();
  const doc = await db.collection('conversations').doc(conversationId).get();

  if (!doc.exists) {
    return { error: createClientErrorResponse(404, 'NOT_FOUND', '指定された対話が見つかりません') };
  }

  const conversation = { id: doc.id, ...doc.data() } as Conversation;

  if (!Array.isArray(conversation.messages)) {
    return {
      error: createServerErrorResponse(
        new Error('conversation.messages is not an array'),
        'POST /api/chat (data integrity)'
      ) as NextResponse,
    };
  }

  return {
    context: {
      conversationSummary: buildConversationSummary(conversation),
      title: conversation.title,
      note: conversation.note,
    },
  };
}

/**
 * スペースから統合コンテキストを構築する
 */
async function buildSpaceContext(
  spaceId: string
): Promise<{ context: ThinkResumeContext } | { error: NextResponse }> {
  if (!isValidDocumentId(spaceId)) {
    return { error: createClientErrorResponse(400, 'INVALID_ID_FORMAT', 'IDのフォーマットが不正です') };
  }

  const db = getDb();
  const spaceDoc = await db.collection('spaces').doc(spaceId).get();

  if (!spaceDoc.exists) {
    return { error: createClientErrorResponse(404, 'NOT_FOUND', '指定されたスペースが見つかりません') };
  }

  const space = { id: spaceDoc.id, ...spaceDoc.data() } as Space;

  // スペースに含まれる対話を全て取得
  const conversations: Conversation[] = [];
  if (space.conversationIds.length > 0) {
    const refs = space.conversationIds.map((id) => db.collection('conversations').doc(id));
    const docs = await db.getAll(...refs);
    for (const doc of docs) {
      if (doc.exists) {
        const conv = { id: doc.id, ...doc.data() } as Conversation;
        if (Array.isArray(conv.messages)) {
          conversations.push(conv);
        }
      }
    }
  }

  return {
    context: {
      conversationSummary: buildSpaceConversationSummary(conversations),
      title: space.title,
      note: space.note,
    },
  };
}

/**
 * ストリーミングチャットエンドポイント
 *
 * @param request - POSTリクエスト（conversationId/spaceId, userMessage, chatHistory）
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

    const { conversationId, spaceId, userMessage, chatHistory } = parseResult.data;

    // コンテキストを構築（対話 or スペース）
    const result = conversationId
      ? await buildConversationContext(conversationId)
      : await buildSpaceContext(spaceId!);

    if ('error' in result) {
      return result.error;
    }

    const { context } = result;

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
