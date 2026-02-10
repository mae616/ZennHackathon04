/**
 * スペースAPIエンドポイント
 *
 * POST /api/spaces
 * - スペースをFirestoreに保存する
 * - Zodでリクエストバリデーションを実行
 * - 成功時はドキュメントIDと作成日時を返す
 *
 * GET /api/spaces
 * - Firestoreからスペース一覧を取得する
 * - updatedAt降順でソート
 * - ページネーション対応（cursor/PAGE_SIZE）
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  SaveSpaceRequestSchema,
  type SaveSpaceResponse,
  type ApiFailure,
  type ListSpacesResponse,
  type Space,
} from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';
import { createClientErrorResponse, createServerErrorResponse } from '@/lib/api/errors';
import { isValidDocumentId } from '@/lib/api/validation';

/** 1ページあたりの取得件数 */
const PAGE_SIZE = 20;

/**
 * スペースを作成する
 *
 * @param request - POSTリクエスト（SaveSpaceRequest形式のJSON）
 * @returns 成功時: { success: true, data: { id, createdAt } }
 * @returns 失敗時: { success: false, error: { code, message, details? } }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveSpaceResponse | ApiFailure>> {
  // リクエストボディをパース
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createClientErrorResponse(400, 'INVALID_JSON', '不正なJSON形式です');
  }

  try {
    // Zodバリデーション
    const parseResult = SaveSpaceRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return createClientErrorResponse(
        400,
        'INVALID_REQUEST_BODY',
        'リクエストボディが不正です',
        { errors: parseResult.error.flatten().fieldErrors } as Record<string, unknown>
      );
    }

    const data = parseResult.data;
    const now = new Date().toISOString();

    const db = getDb();

    // conversationIds の存在チェック（指定されている場合のみ）
    if (data.conversationIds.length > 0) {
      const refs = data.conversationIds.map(id => db.collection('conversations').doc(id));
      const docs = await db.getAll(...refs);
      const missingIds = data.conversationIds.filter((_, i) => !docs[i].exists);
      if (missingIds.length > 0) {
        return createClientErrorResponse(
          400,
          'INVALID_CONVERSATION_IDS',
          '存在しない対話IDが含まれています',
          { missingIds } as Record<string, unknown>
        );
      }
    }

    // Firestoreに保存
    const docRef = await db.collection('spaces').add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    // 成功レスポンス
    const response: SaveSpaceResponse = {
      success: true,
      data: {
        id: docRef.id,
        createdAt: now,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return createServerErrorResponse(error, 'POST /api/spaces');
  }
}

/**
 * スペース一覧を取得する
 *
 * @param request - GETリクエスト（クエリパラメータ: cursor?）
 * @returns 成功時: { success: true, data: { spaces, nextCursor? } }
 * @returns 失敗時: { success: false, error: { code, message } }
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ListSpacesResponse | ApiFailure>> {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');

    const db = getDb();
    let query = db
      .collection('spaces')
      .orderBy('updatedAt', 'desc')
      .limit(PAGE_SIZE + 1); // 次ページの有無を判定するため+1件取得

    // カーソル指定時はフォーマット検証後、該当ドキュメント以降から取得
    if (cursor) {
      if (!isValidDocumentId(cursor)) {
        return createClientErrorResponse(400, 'INVALID_CURSOR', 'カーソルのフォーマットが不正です');
      }
      const cursorDoc = await db.collection('spaces').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;

    // 次ページの有無を判定
    const hasNextPage = docs.length > PAGE_SIZE;
    const spaceDocs = hasNextPage ? docs.slice(0, PAGE_SIZE) : docs;

    // ドキュメントをSpace型に変換
    // NOTE: Firestoreのデータは保存時にZodで検証済みのため、型アサーションを使用
    const spaces: Space[] = spaceDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Space[];

    // 次ページカーソルを生成（最後のドキュメントIDを使用）
    const nextCursor = hasNextPage
      ? spaceDocs[spaceDocs.length - 1].id
      : undefined;

    const response: ListSpacesResponse = {
      success: true,
      data: {
        spaces,
        ...(nextCursor && { nextCursor }),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return createServerErrorResponse(error, 'GET /api/spaces');
  }
}
