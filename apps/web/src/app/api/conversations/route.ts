/**
 * 対話APIエンドポイント
 *
 * POST /api/conversations
 * - 拡張機能からキャプチャした対話をFirestoreに保存する
 * - Zodでリクエストバリデーションを実行
 * - 成功時はドキュメントIDと作成日時を返す
 *
 * GET /api/conversations
 * - Firestoreから対話一覧を取得する
 * - updatedAt降順でソート
 * - ページネーション対応（cursor/PAGE_SIZE）
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  SaveConversationRequestSchema,
  type ApiError,
  type SaveConversationResponse,
  type ApiFailure,
  type ListConversationsResponse,
  type Conversation,
} from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';
import { createServerErrorResponse } from '@/lib/api/errors';

/** 1ページあたりの取得件数 */
const PAGE_SIZE = 20;

/**
 * 対話を保存する
 *
 * @param request - POSTリクエスト（SaveConversationRequest形式のJSON）
 * @returns 成功時: { success: true, data: { id, createdAt } }
 * @returns 失敗時: { success: false, error: { code, message, details? } }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveConversationResponse | ApiFailure>> {
  // リクエストボディをパース
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const error: ApiError = {
      code: 'INVALID_JSON',
      message: '不正なJSON形式です',
    };
    return NextResponse.json({ success: false, error } as ApiFailure, {
      status: 400,
    });
  }

  try {
    // Zodバリデーション
    const parseResult = SaveConversationRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'リクエストの形式が不正です',
        details: parseResult.error.flatten(),
      };
      return NextResponse.json({ success: false, error } as ApiFailure, {
        status: 400,
      });
    }

    const data = parseResult.data;
    const now = new Date().toISOString();

    // Firestoreに保存
    const db = getDb();
    const docRef = await db.collection('conversations').add({
      ...data,
      status: 'active', // デフォルトステータス
      createdAt: now,
      updatedAt: now,
    });

    // 成功レスポンス
    const response: SaveConversationResponse = {
      success: true,
      data: {
        id: docRef.id,
        createdAt: now,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return createServerErrorResponse(error, 'POST /api/conversations');
  }
}

/**
 * 対話一覧を取得する
 *
 * @param request - GETリクエスト（クエリパラメータ: cursor?）
 * @returns 成功時: { success: true, data: { conversations, nextCursor? } }
 * @returns 失敗時: { success: false, error: { code, message } }
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ListConversationsResponse | ApiFailure>> {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');

    const db = getDb();
    let query = db
      .collection('conversations')
      .orderBy('updatedAt', 'desc')
      .limit(PAGE_SIZE + 1); // 次ページの有無を判定するため+1件取得

    // カーソル指定時は該当ドキュメント以降から取得
    if (cursor) {
      const cursorDoc = await db.collection('conversations').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;

    // 次ページの有無を判定
    const hasNextPage = docs.length > PAGE_SIZE;
    const conversationDocs = hasNextPage ? docs.slice(0, PAGE_SIZE) : docs;

    // ドキュメントをConversation型に変換
    // NOTE: Firestoreのデータは保存時にZodで検証済みのため、型アサーションを使用
    // 将来的にはConversationSchema.parseで再検証することで堅牢性を向上できる
    const conversations: Conversation[] = conversationDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[];

    // 次ページカーソルを生成（最後のドキュメントIDを使用）
    const nextCursor = hasNextPage
      ? conversationDocs[conversationDocs.length - 1].id
      : undefined;

    const response: ListConversationsResponse = {
      success: true,
      data: {
        conversations,
        ...(nextCursor && { nextCursor }),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return createServerErrorResponse(error, 'GET /api/conversations');
  }
}
