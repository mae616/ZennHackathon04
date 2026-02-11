/**
 * スペース詳細APIエンドポイント
 *
 * GET /api/spaces/:id
 * - 指定されたIDのスペースを取得する
 * - IDフォーマット検証を行う
 * - 存在しない場合は404エラーを返す
 *
 * PATCH /api/spaces/:id
 * - 指定されたIDのスペースを部分更新する
 * - title, description, note, conversationIds の更新に対応
 * - updatedAt を自動更新
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  type ApiFailure,
  type GetSpaceResponse,
  type Space,
  type UpdateSpaceResponse,
  UpdateSpaceRequestSchema,
} from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';
import { createClientErrorResponse, createServerErrorResponse } from '@/lib/api/errors';
import { isValidDocumentId } from '@/lib/api/validation';

/** ルートパラメータの型定義 */
type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * 指定IDのスペースを取得する
 *
 * @param _request - GETリクエスト（未使用だがNext.js API規約で必要）
 * @param params - ルートパラメータ（id）
 * @returns 成功時: { success: true, data: Space }
 * @returns 失敗時: { success: false, error: { code, message } }
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<GetSpaceResponse | ApiFailure>> {
  try {
    const { id } = await params;

    // IDフォーマット検証
    if (!isValidDocumentId(id)) {
      return createClientErrorResponse(400, 'INVALID_ID_FORMAT', 'IDのフォーマットが不正です');
    }

    const db = getDb();
    const docRef = db.collection('spaces').doc(id);
    const doc = await docRef.get();

    // ドキュメントが存在しない場合
    if (!doc.exists) {
      return createClientErrorResponse(404, 'NOT_FOUND', '指定されたスペースが見つかりません');
    }

    // Space型に変換して返す
    // NOTE: Firestoreのデータは保存時にZodで検証済みのため、型アサーションを使用
    const space: Space = {
      id: doc.id,
      ...doc.data(),
    } as Space;

    const response: GetSpaceResponse = {
      success: true,
      data: space,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return createServerErrorResponse(error, 'GET /api/spaces/:id');
  }
}

/**
 * スペースを部分更新する
 *
 * @param request - PATCHリクエスト（body: { title?, description?, note?, conversationIds? }）
 * @param params - ルートパラメータ（id）
 * @returns 成功時: { success: true, data: { updatedAt } }
 * @returns 失敗時: { success: false, error: { code, message } }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UpdateSpaceResponse | ApiFailure>> {
  try {
    const { id } = await params;

    // IDフォーマット検証
    if (!isValidDocumentId(id)) {
      return createClientErrorResponse(400, 'INVALID_ID_FORMAT', 'IDのフォーマットが不正です');
    }

    // リクエストボディのパース（JSON構文エラーを個別ハンドリング）
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createClientErrorResponse(400, 'INVALID_JSON', '不正なJSON形式です');
    }

    const parseResult = UpdateSpaceRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return createClientErrorResponse(
        400,
        'INVALID_REQUEST_BODY',
        'リクエストボディが不正です',
        { errors: parseResult.error.flatten().fieldErrors } as Record<string, unknown>
      );
    }

    const db = getDb();
    const docRef = db.collection('spaces').doc(id);
    const doc = await docRef.get();

    // ドキュメントが存在しない場合
    if (!doc.exists) {
      return createClientErrorResponse(404, 'NOT_FOUND', '指定されたスペースが見つかりません');
    }

    // 更新データの構築（undefinedフィールドは除外）
    const updatedAt = new Date().toISOString();
    const updateData: Record<string, unknown> = { updatedAt };
    const { title, description, note, conversationIds } = parseResult.data;

    // 明示的に渡されたフィールドのみ更新
    // NOTE: undefined と空文字を区別。空文字は値削除として扱う
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (note !== undefined) updateData.note = note;

    // conversationIds の存在チェック（指定されている場合のみ）
    // NOTE: conversationIds は全置換方式。並行更新でのデータ消失リスクがあるが、
    // 単一ユーザー想定のHackathon規模のため許容。将来的には差分更新（arrayUnion/arrayRemove）
    // またはFirestoreトランザクションの導入を検討
    if (conversationIds !== undefined) {
      if (conversationIds.length > 0) {
        const refs = conversationIds.map(cid => db.collection('conversations').doc(cid));
        const convDocs = await db.getAll(...refs);
        const missingIds = conversationIds.filter((_, i) => !convDocs[i].exists);
        if (missingIds.length > 0) {
          return createClientErrorResponse(
            400,
            'INVALID_CONVERSATION_IDS',
            '存在しない対話IDが含まれています',
            { missingIds } as Record<string, unknown>
          );
        }
      }
      updateData.conversationIds = conversationIds;
    }

    // Firestore に更新を適用
    await docRef.update(updateData);

    const response: UpdateSpaceResponse = {
      success: true,
      data: { updatedAt },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return createServerErrorResponse(error, 'PATCH /api/spaces/:id');
  }
}
