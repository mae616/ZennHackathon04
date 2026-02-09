/**
 * 対話詳細APIエンドポイント
 *
 * GET /api/conversations/:id
 * - 指定されたIDの対話を取得する
 * - IDフォーマット検証を行う
 * - 存在しない場合は404エラーを返す
 *
 * PATCH /api/conversations/:id
 * - 指定されたIDの対話を部分更新する
 * - note フィールドの更新に対応
 * - updatedAt を自動更新
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  type ApiError,
  type ApiFailure,
  type GetConversationResponse,
  type Conversation,
  type UpdateConversationResponse,
  UpdateConversationRequestSchema,
} from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';
import { createClientErrorResponse, createServerErrorResponse } from '@/lib/api/errors';
import { isValidDocumentId } from '@/lib/api/validation';

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

/**
 * 対話を部分更新する（メモの編集）
 *
 * @param request - PATCHリクエスト（body: { note?: string }）
 * @param params - ルートパラメータ（id）
 * @returns 成功時: { success: true, data: { updatedAt } }
 * @returns 失敗時: { success: false, error: { code, message } }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UpdateConversationResponse | ApiFailure>> {
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

    // リクエストボディのパース（JSON構文エラーを個別ハンドリング）
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createClientErrorResponse(400, 'INVALID_JSON', '不正なJSON形式です');
    }

    const parseResult = UpdateConversationRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const error: ApiError = {
        code: 'INVALID_REQUEST_BODY',
        message: 'リクエストボディが不正です',
        details: { errors: parseResult.error.flatten().fieldErrors },
      };
      return NextResponse.json({ success: false, error } as ApiFailure, {
        status: 400,
      });
    }

    const { note } = parseResult.data;

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

    // 更新データの構築（undefinedフィールドは除外）
    const updatedAt = new Date().toISOString();
    const updateData: Record<string, unknown> = { updatedAt };

    // note が明示的に渡された場合のみ更新
    // NOTE: undefined と空文字を区別。空文字はメモ削除として扱う
    if (note !== undefined) {
      updateData.note = note;
    }

    // Firestore に更新を適用
    await docRef.update(updateData);

    const response: UpdateConversationResponse = {
      success: true,
      data: { updatedAt },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return createServerErrorResponse(error, 'PATCH /api/conversations/:id');
  }
}
