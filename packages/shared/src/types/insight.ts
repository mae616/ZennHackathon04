/**
 * @fileoverview 洞察データの型定義
 *
 * Geminiとの対話から保存するQ&A形式の洞察に使用するZodスキーマと型を定義する。
 * ユーザーの質問とGeminiの回答をペアで保存し、重要なやり取りを資産化する。
 */
import { z } from 'zod';

/**
 * 洞察（Insight）のスキーマ
 *
 * Geminiとの思考再開チャットで得られたQ&Aペアを表す。
 * ユーザーの質問と、それに対するGeminiの回答をセットで保存する。
 */
export const InsightSchema = z.object({
  /** 洞察の一意識別子 */
  id: z.string().min(1),
  /** 紐づく対話のID */
  conversationId: z.string().min(1),
  /** ユーザーの質問 */
  question: z.string(),
  /** Geminiの回答 */
  answer: z.string(),
  /** 作成日時（ISO 8601形式） */
  createdAt: z.string().datetime(),
  /** 更新日時（ISO 8601形式） */
  updatedAt: z.string().datetime(),
});
export type Insight = z.infer<typeof InsightSchema>;
