/**
 * @fileoverview API通信の型定義
 *
 * REST APIのリクエスト・レスポンスに使用するZodスキーマと型を定義する。
 * 拡張機能からWebアプリAPIへの通信で共有される型定義。
 */
import { z } from 'zod';
import { ConversationSchema } from './conversation';

/**
 * API共通のエラーレスポンススキーマ
 */
export const ApiErrorSchema = z.object({
  /** エラーコード */
  code: z.string(),
  /** エラーメッセージ */
  message: z.string(),
  /** 詳細情報（デバッグ用） */
  details: z.record(z.unknown()).optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * API共通の成功レスポンススキーマ
 */
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

/**
 * API共通の失敗レスポンススキーマ
 */
export const ApiFailureSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});
export type ApiFailure = z.infer<typeof ApiFailureSchema>;

/**
 * 対話保存リクエストのスキーマ
 */
export const SaveConversationRequestSchema = ConversationSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
export type SaveConversationRequest = z.infer<typeof SaveConversationRequestSchema>;

/**
 * 対話保存レスポンスのスキーマ
 */
export const SaveConversationResponseSchema = ApiSuccessSchema(
  z.object({
    id: z.string(),
    createdAt: z.string().datetime(),
  })
);
export type SaveConversationResponse = z.infer<typeof SaveConversationResponseSchema>;

/**
 * 対話一覧取得レスポンスのスキーマ
 */
export const ListConversationsResponseSchema = ApiSuccessSchema(
  z.object({
    conversations: z.array(ConversationSchema),
    nextCursor: z.string().optional(),
  })
);
export type ListConversationsResponse = z.infer<typeof ListConversationsResponseSchema>;

/**
 * 対話詳細取得レスポンスのスキーマ
 */
export const GetConversationResponseSchema = ApiSuccessSchema(ConversationSchema);
export type GetConversationResponse = z.infer<typeof GetConversationResponseSchema>;

/**
 * 対話更新（PATCH）リクエストのスキーマ
 * - note: メモの更新
 * - title, tags 等も将来的に拡張可能
 */
export const UpdateConversationRequestSchema = z.object({
  /** 更新するメモ内容 */
  note: z.string().optional(),
});
export type UpdateConversationRequest = z.infer<typeof UpdateConversationRequestSchema>;

/**
 * 対話更新（PATCH）レスポンスのスキーマ
 */
export const UpdateConversationResponseSchema = ApiSuccessSchema(
  z.object({
    /** 更新日時（ISO 8601形式） */
    updatedAt: z.string().datetime(),
  })
);
export type UpdateConversationResponse = z.infer<typeof UpdateConversationResponseSchema>;
