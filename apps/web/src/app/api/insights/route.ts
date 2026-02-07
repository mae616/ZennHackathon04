/**
 * 洞察APIエンドポイント
 *
 * POST /api/insights
 * - Geminiとの対話から得たQ&AペアをFirestoreに保存する
 * - conversationId, question, answer をバリデーション
 * - 成功時はドキュメントIDと作成日時を返す
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  SaveInsightRequestSchema,
  type ApiError,
  type SaveInsightResponse,
  type ApiFailure,
} from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';
import { createServerErrorResponse } from '@/lib/api/errors';

/**
 * 洞察を保存する
 *
 * @param request - POSTリクエスト（SaveInsightRequest形式のJSON）
 * @returns 成功時: { success: true, data: { id, createdAt } }
 * @returns 失敗時: { success: false, error: { code, message, details? } }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveInsightResponse | ApiFailure>> {
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
    const parseResult = SaveInsightRequestSchema.safeParse(body);
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

    // 参照先の対話が存在するか確認
    const db = getDb();
    const conversationDoc = await db.collection('conversations').doc(data.conversationId).get();
    if (!conversationDoc.exists) {
      const error: ApiError = {
        code: 'NOT_FOUND',
        message: '指定された対話が見つかりません',
      };
      return NextResponse.json({ success: false, error } as ApiFailure, {
        status: 404,
      });
    }

    // Firestoreに保存
    const docRef = await db.collection('insights').add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    const response: SaveInsightResponse = {
      success: true,
      data: {
        id: docRef.id,
        createdAt: now,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return createServerErrorResponse(error, 'POST /api/insights');
  }
}
