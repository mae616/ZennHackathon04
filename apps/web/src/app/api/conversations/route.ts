/**
 * 対話保存APIエンドポイント
 *
 * POST /api/conversations
 * - 拡張機能からキャプチャした対話をFirestoreに保存する
 * - Zodでリクエストバリデーションを実行
 * - 成功時はドキュメントIDと作成日時を返す
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  SaveConversationRequestSchema,
  type ApiError,
  type SaveConversationResponse,
  type ApiFailure,
} from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';

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
  try {
    // リクエストボディをパース
    const body = await request.json();

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
    // エラーログ出力（本番ではCloud Loggingに送信される想定）
    console.error('POST /api/conversations error:', error);

    // Firebase未初期化エラーの判定
    const isFirebaseError =
      error instanceof Error &&
      error.message.includes('Firebase Admin SDK の初期化');

    const apiError: ApiError = {
      code: isFirebaseError ? 'FIREBASE_NOT_CONFIGURED' : 'INTERNAL_ERROR',
      message: isFirebaseError
        ? 'Firebaseの設定が完了していません'
        : 'サーバーエラーが発生しました',
    };

    return NextResponse.json({ success: false, error: apiError } as ApiFailure, {
      status: 500,
    });
  }
}
