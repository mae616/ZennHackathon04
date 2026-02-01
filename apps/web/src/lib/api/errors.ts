/**
 * @fileoverview API共通エラーハンドリングユーティリティ
 *
 * API Routesで使用するエラー判定と変換処理を提供する。
 * Firebase未初期化エラーなど、共通のエラーパターンを一元管理する。
 */

import { NextResponse } from 'next/server';
import type { ApiError, ApiFailure } from '@zenn-hackathon04/shared';

/**
 * Firebase未初期化エラーかどうかを判定する
 *
 * @param error - 判定対象のエラー
 * @returns Firebase未初期化エラーの場合true
 */
export function isFirebaseNotConfiguredError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('Firebase Admin SDK の初期化')
  );
}

/**
 * サーバーエラーレスポンスを生成する
 *
 * エラーの種類に応じて適切なApiFailureレスポンスを生成する。
 * Firebase未初期化エラーの場合は専用のエラーコードを返す。
 *
 * @param error - 発生したエラー
 * @param logPrefix - ログ出力時のプレフィックス（例: "POST /api/conversations"）
 * @returns 500ステータスのNextResponse
 */
export function createServerErrorResponse(
  error: unknown,
  logPrefix: string
): NextResponse<ApiFailure> {
  console.error(`${logPrefix} error:`, error);

  const isFirebaseError = isFirebaseNotConfiguredError(error);

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
