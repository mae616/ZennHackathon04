/**
 * 対話別の洞察一覧APIエンドポイント
 *
 * GET /api/conversations/:id/insights
 * - 指定した対話に紐づく洞察をFirestoreから取得する
 * - createdAt昇順でソート（新しいものが下＝ページの時系列に合わせる）
 */
import { NextRequest, NextResponse } from 'next/server';
import type {
  ApiFailure,
  ListInsightsResponse,
  Insight,
} from '@zenn-hackathon04/shared';
import { getDb } from '@/lib/firebase/admin';
import { createClientErrorResponse, createServerErrorResponse } from '@/lib/api/errors';
import { isValidDocumentId } from '@/lib/api/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * 対話に紐づく洞察一覧を取得する
 *
 * @param _request - GETリクエスト
 * @param context - ルートコンテキスト（params.id: 対話ID）
 * @returns 成功時: { success: true, data: { insights } }
 * @returns 失敗時: { success: false, error: { code, message } }
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ListInsightsResponse | ApiFailure>> {
  try {
    const { id: conversationId } = await context.params;

    // IDフォーマット検証
    if (!isValidDocumentId(conversationId)) {
      return createClientErrorResponse(400, 'INVALID_ID_FORMAT', 'IDのフォーマットが不正です');
    }

    const db = getDb();
    // NOTE: where + orderBy の複合クエリはFirestoreの複合インデックスが必要なため、
    // クライアント側でソートする方式を採用（Hackathon規模では十分）
    const snapshot = await db
      .collection('insights')
      .where('conversationId', '==', conversationId)
      .get();

    // NOTE: Firestoreのデータは保存時にZodで検証済みのため、型アサーションを使用
    // ドキュメントをInsight型に変換し、createdAt昇順でソート（新しいものが下）
    const insights: Insight[] = (
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Insight[]
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const response: ListInsightsResponse = {
      success: true,
      data: {
        insights,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return createServerErrorResponse(error, 'GET /api/conversations/:id/insights');
  }
}
