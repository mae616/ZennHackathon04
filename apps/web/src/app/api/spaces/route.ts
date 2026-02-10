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
  type ApiError,
  type SaveSpaceResponse,
  type ApiFailure,
  type ListSpacesResponse,
  type Space,
} from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';
import { createServerErrorResponse } from '@/lib/api/errors';

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
    const parseResult = SaveSpaceRequestSchema.safeParse(body);
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

    // カーソル指定時は該当ドキュメント以降から取得
    if (cursor) {
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
