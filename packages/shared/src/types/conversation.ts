/**
 * @fileoverview 対話データの型定義
 *
 * LLM対話のキャプチャ・保存・管理に使用するZodスキーマと型を定義する。
 * 拡張機能とWebアプリで共有される中核的な型定義。
 */
import { z } from 'zod';

/**
 * メッセージの役割を定義するスキーマ
 * - user: ユーザーからの入力
 * - assistant: AIアシスタントの応答
 * - system: システムメッセージ
 */
export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

/**
 * 単一のメッセージを表すスキーマ
 */
export const MessageSchema = z.object({
  /** メッセージの一意識別子 */
  id: z.string().min(1),
  /** メッセージの役割 */
  role: MessageRoleSchema,
  /** メッセージの内容 */
  content: z.string(),
  /** メッセージのタイムスタンプ（ISO 8601形式） */
  timestamp: z.string().datetime(),
});
export type Message = z.infer<typeof MessageSchema>;

/**
 * 対話セッションの状態を定義するスキーマ
 */
export const ConversationStatusSchema = z.enum(['active', 'archived', 'deleted']);
export type ConversationStatus = z.infer<typeof ConversationStatusSchema>;

/**
 * 対話のソースプラットフォームを定義するスキーマ
 */
export const SourcePlatformSchema = z.enum(['chatgpt', 'claude', 'gemini']);
export type SourcePlatform = z.infer<typeof SourcePlatformSchema>;

/**
 * 対話ログ全体を表すスキーマ
 * LLMとのやり取りを保存・管理するための基本単位
 */
export const ConversationSchema = z.object({
  /** 対話の一意識別子 */
  id: z.string().min(1),
  /** 対話のタイトル（ユーザーが設定または自動生成） */
  title: z.string(),
  /** 対話のソースプラットフォーム */
  source: SourcePlatformSchema,
  /** メッセージの配列 */
  messages: z.array(MessageSchema),
  /** 対話の状態 */
  status: ConversationStatusSchema.default('active'),
  /** ユーザーが付けたタグ */
  tags: z.array(z.string()).default([]),
  /** 作成日時（ISO 8601形式） */
  createdAt: z.string().datetime(),
  /** 更新日時（ISO 8601形式） */
  updatedAt: z.string().datetime(),
  /** ユーザーによる重要度メモ（なぜ保存したか） */
  note: z.string().optional(),
});
export type Conversation = z.infer<typeof ConversationSchema>;
