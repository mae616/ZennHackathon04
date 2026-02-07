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
 * Vertex AI未初期化エラーかどうかを判定する
 *
 * @param error - 判定対象のエラー
 * @returns Vertex AI未初期化エラーの場合true
 */
export function isVertexAINotConfiguredError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('Vertex AI の初期化')
  );
}

/**
 * Vertex AI APIエラーかどうかを判定する
 *
 * @param error - 判定対象のエラー
 * @returns Vertex AI APIエラーの場合true
 */
export function isVertexAIApiError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('Vertex AI API') ||
      error.message.includes('PERMISSION_DENIED') ||
      error.message.includes('RESOURCE_EXHAUSTED') ||
      error.message.includes('NOT_FOUND'))
  );
}

/**
 * クライアントエラーレスポンス（400/404等）を生成する
 *
 * バリデーションエラーやリソース未発見など、クライアント起因のエラーに使用する。
 *
 * @param status - HTTPステータスコード（400, 404 等）
 * @param code - エラーコード（例: 'VALIDATION_ERROR', 'NOT_FOUND'）
 * @param message - エラーメッセージ
 * @param details - バリデーション詳細など追加情報（任意）
 * @returns NextResponse
 */
export function createClientErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiFailure> {
  const apiError: ApiError = { code, message, ...(details ? { details } : {}) };
  return NextResponse.json({ success: false, error: apiError } as ApiFailure, {
    status,
  });
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
  const isVertexAIConfigError = isVertexAINotConfiguredError(error);
  const isVertexAIError = isVertexAIApiError(error);

  let code: string;
  let message: string;

  if (isFirebaseError) {
    code = 'FIREBASE_NOT_CONFIGURED';
    message = 'Firebaseの設定が完了していません';
  } else if (isVertexAIConfigError) {
    code = 'VERTEX_AI_NOT_CONFIGURED';
    message = 'Vertex AIの設定が完了していません';
  } else if (isVertexAIError) {
    code = 'VERTEX_AI_ERROR';
    message = error instanceof Error ? error.message : 'Vertex AI APIエラーが発生しました';
  } else {
    code = 'INTERNAL_ERROR';
    message = 'サーバーエラーが発生しました';
  }

  const apiError: ApiError = { code, message };

  return NextResponse.json({ success: false, error: apiError } as ApiFailure, {
    status: 500,
  });
}
