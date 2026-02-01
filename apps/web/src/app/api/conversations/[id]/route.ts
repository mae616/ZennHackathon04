/**
 * 対話詳細APIエンドポイント
 *
 * GET /api/conversations/:id
 * - 指定されたIDの対話を取得する
 * - 存在しない場合は404エラーを返す
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  type ApiError,
  type ApiFailure,
  type GetConversationResponse,
  type Conversation,
} from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';

/** ルートパラメータの型定義 */
type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * 指定IDの対話を取得する
 *
 * @param _request - GETリクエスト（未使用だがNext.js API規約で必要）
 * @param params - ルートパラメータ（id）
 * @returns 成功時: { success: true, data: Conversation }
 * @returns 失敗時: { success: false, error: { code, message } }
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<GetConversationResponse | ApiFailure>> {
  try {
    const { id } = await params;

    const db = getDb();
    const docRef = db.collection('conversations').doc(id);
    const doc = await docRef.get();

    // ドキュメントが存在しない場合
    if (!doc.exists) {
      const error: ApiError = {
        code: 'NOT_FOUND',
        message: '指定された対話が見つかりません',
      };
      return NextResponse.json({ success: false, error } as ApiFailure, {
        status: 404,
      });
    }

    // Conversation型に変換して返す
    const conversation: Conversation = {
      id: doc.id,
      ...doc.data(),
    } as Conversation;

    const response: GetConversationResponse = {
      success: true,
      data: conversation,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET /api/conversations/:id error:', error);

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
