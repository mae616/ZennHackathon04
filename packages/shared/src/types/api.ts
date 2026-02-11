/**
 * @fileoverview API通信の型定義
 *
 * REST APIのリクエスト・レスポンスに使用するZodスキーマと型を定義する。
 * 拡張機能からWebアプリAPIへの通信で共有される型定義。
 */
import { z } from 'zod';
import { ConversationSchema } from './conversation';
import { InsightSchema } from './insight';
import { SpaceSchema } from './space';

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
  /** 更新するメモ内容（Firestoreドキュメントサイズ上限を考慮し50000文字制限） */
  note: z.string().max(50000).optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: '少なくとも1つのフィールドを指定してください' }
);
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

/**
 * 洞察保存リクエストのスキーマ
 *
 * conversationId（対話レベル）または spaceId（スペースレベル）のいずれか一方を指定する。
 * 両方指定・両方省略はバリデーションエラーとなる。
 */
export const SaveInsightRequestSchema = z.object({
  /** 紐づく対話のID（対話レベルの洞察の場合） */
  conversationId: z.string().min(1).optional(),
  /** 紐づくスペースのID（スペースレベルの洞察の場合） */
  spaceId: z.string().min(1).optional(),
  /** ユーザーの質問 */
  question: z.string().min(1).max(10000),
  /** Geminiの回答 */
  answer: z.string().min(1).max(10000),
}).refine(
  (data) => (data.conversationId && !data.spaceId) || (!data.conversationId && data.spaceId),
  { message: 'conversationId または spaceId のいずれか一方を指定してください' }
);
export type SaveInsightRequest = z.infer<typeof SaveInsightRequestSchema>;

/**
 * 洞察保存レスポンスのスキーマ
 */
export const SaveInsightResponseSchema = ApiSuccessSchema(
  z.object({
    /** 保存された洞察のID */
    id: z.string(),
    /** 作成日時（ISO 8601形式） */
    createdAt: z.string().datetime(),
  })
);
export type SaveInsightResponse = z.infer<typeof SaveInsightResponseSchema>;

/**
 * 洞察一覧取得レスポンスのスキーマ
 */
export const ListInsightsResponseSchema = ApiSuccessSchema(
  z.object({
    /** 洞察の配列 */
    insights: z.array(InsightSchema),
  })
);
export type ListInsightsResponse = z.infer<typeof ListInsightsResponseSchema>;

// ─── スペース関連 ───

/**
 * スペース作成リクエストのスキーマ
 */
export const SaveSpaceRequestSchema = SpaceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type SaveSpaceRequest = z.infer<typeof SaveSpaceRequestSchema>;

/**
 * スペース作成レスポンスのスキーマ
 */
export const SaveSpaceResponseSchema = ApiSuccessSchema(
  z.object({
    /** 作成されたスペースのID */
    id: z.string(),
    /** 作成日時（ISO 8601形式） */
    createdAt: z.string().datetime(),
  })
);
export type SaveSpaceResponse = z.infer<typeof SaveSpaceResponseSchema>;

/**
 * スペース一覧取得レスポンスのスキーマ
 */
export const ListSpacesResponseSchema = ApiSuccessSchema(
  z.object({
    /** スペースの配列 */
    spaces: z.array(SpaceSchema),
    /** 次ページカーソル */
    nextCursor: z.string().optional(),
  })
);
export type ListSpacesResponse = z.infer<typeof ListSpacesResponseSchema>;

/**
 * スペース詳細取得レスポンスのスキーマ
 */
export const GetSpaceResponseSchema = ApiSuccessSchema(SpaceSchema);
export type GetSpaceResponse = z.infer<typeof GetSpaceResponseSchema>;

/**
 * スペース更新（PATCH）リクエストのスキーマ
 * - title, description, note, conversationIds を部分更新可能
 */
export const UpdateSpaceRequestSchema = z.object({
  /** スペースタイトル */
  title: z.string().min(1).max(200).optional(),
  /** スペースの説明文 */
  description: z.string().max(1000).optional(),
  /** メモ（Firestoreドキュメントサイズ上限を考慮し50000文字制限） */
  note: z.string().max(50000).optional(),
  /** 含まれる対話IDの配列（全置換、最大100件、Firestore Document ID制約に準拠） */
  conversationIds: z.array(z.string().min(1).max(1500))
    .max(100)
    .refine(ids => new Set(ids).size === ids.length, { message: '重複する対話IDがあります' })
    .optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: '少なくとも1つのフィールドを指定してください' }
);
export type UpdateSpaceRequest = z.infer<typeof UpdateSpaceRequestSchema>;

/**
 * スペース更新（PATCH）レスポンスのスキーマ
 */
export const UpdateSpaceResponseSchema = ApiSuccessSchema(
  z.object({
    /** 更新日時（ISO 8601形式） */
    updatedAt: z.string().datetime(),
  })
);
export type UpdateSpaceResponse = z.infer<typeof UpdateSpaceResponseSchema>;
