/**
 * @fileoverview スペースデータの型定義
 *
 * 複数の対話をグループ化し、統合コンテキストで思考を継続するための
 * スペース機能に使用するZodスキーマと型を定義する。
 */
import { z } from 'zod';

/**
 * スペース（Space）のスキーマ
 *
 * 関連する複数の対話をグループ化し、統合コンテキストで
 * Geminiと対話するための基本単位。
 */
export const SpaceSchema = z.object({
  /** スペースの一意識別子 */
  id: z.string().min(1),
  /** スペースのタイトル */
  title: z.string().min(1).max(200),
  /** スペースの説明文 */
  description: z.string().max(1000).optional(),
  /** このスペースに含まれる対話IDの配列（最大100件、Firestore Document ID制約に準拠） */
  conversationIds: z.array(z.string().min(1).max(1500))
    .max(100)
    .refine(ids => new Set(ids).size === ids.length, { message: '重複する対話IDがあります' })
    .default([]),
  /** ユーザーによるメモ（Firestoreドキュメントサイズ上限を考慮し50000文字制限） */
  note: z.string().max(50000).optional(),
  /** 作成日時（ISO 8601形式） */
  createdAt: z.string().datetime(),
  /** 更新日時（ISO 8601形式） */
  updatedAt: z.string().datetime(),
});
export type Space = z.infer<typeof SpaceSchema>;
