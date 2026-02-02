/**
 * 対話詳細APIエンドポイント
 *
 * GET /api/conversations/:id
 * - 指定されたIDの対話を取得する
 * - IDフォーマット検証を行う
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
import { createServerErrorResponse } from '@/lib/api/errors';

/** ルートパラメータの型定義 */
type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * Firestore Document IDのフォーマットを検証する
 * - 空文字でない
 * - 1〜1500バイト以内
 * - スラッシュ（/）を含まない
 * - 単一のピリオド（.）またはダブルピリオド（..）でない
 * - __.*__の形式でない（予約済み）
 *
 * @param id - 検証対象のID
 * @returns 有効なIDの場合true
 */
function isValidDocumentId(id: string): boolean {
  if (!id || id.length === 0 || id.length > 1500) {
    return false;
  }
  if (id.includes('/')) {
    return false;
  }
  if (id === '.' || id === '..') {
    return false;
  }
  if (/^__.*__$/.test(id)) {
    return false;
  }
  return true;
}

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

    // IDフォーマット検証
    if (!isValidDocumentId(id)) {
      const error: ApiError = {
        code: 'INVALID_ID_FORMAT',
        message: 'IDのフォーマットが不正です',
      };
      return NextResponse.json({ success: false, error } as ApiFailure, {
        status: 400,
      });
    }

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
    // NOTE: Firestoreのデータは保存時にZodで検証済みのため、型アサーションを使用
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
    return createServerErrorResponse(error, 'GET /api/conversations/:id');
  }
}
