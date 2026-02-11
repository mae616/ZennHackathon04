/**
 * 洞察APIエンドポイント
 *
 * POST /api/insights
 * - Geminiとの対話から得たQ&AペアをFirestoreに保存する
 * - conversationId または spaceId のいずれか一方を指定（排他バリデーション）
 * - 参照先ドキュメントの存在確認後、insightsコレクションに保存する
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
import { createClientErrorResponse, createServerErrorResponse } from '@/lib/api/errors';
import { isValidDocumentId } from '@/lib/api/validation';

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
    // Zodバリデーション（conversationId / spaceId の排他チェック含む）
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
    const db = getDb();

    // IDフォーマット検証（Firestoreの予約語やスラッシュを含むIDを弾く）
    const targetId = data.conversationId ?? data.spaceId;
    if (!targetId || !isValidDocumentId(targetId)) {
      return createClientErrorResponse(400, 'INVALID_ID_FORMAT', 'IDのフォーマットが不正です');
    }

    // 参照先ドキュメントの存在確認（対話 or スペース）
    if (data.conversationId) {
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
    } else if (data.spaceId) {
      const spaceDoc = await db.collection('spaces').doc(data.spaceId).get();
      if (!spaceDoc.exists) {
        const error: ApiError = {
          code: 'NOT_FOUND',
          message: '指定されたスペースが見つかりません',
        };
        return NextResponse.json({ success: false, error } as ApiFailure, {
          status: 404,
        });
      }
    } else {
      // Zodのrefineで排他バリデーション済みだが、防御的にガード
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'conversationId または spaceId のいずれか一方が必要です',
      };
      return NextResponse.json({ success: false, error } as ApiFailure, {
        status: 400,
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
