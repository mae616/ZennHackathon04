/**
 * @fileoverview フォーム管理コンポーネント
 *
 * タイトル、メモ、タグの編集フォームを管理する。
 * Content Scriptから取得した対話データを表示し、
 * ユーザーの編集を受け付けて保存リクエスト形式に変換する。
 */

import type { Message, SourcePlatform, SaveConversationRequest } from '@zenn-hackathon04/shared';
import { TagManager } from './tags';
import { escapeHtml } from '../utils/escape';

/**
 * フォームに表示する対話データの型
 */
export interface ConversationFormData {
  /** 対話のタイトル（自動抽出または手動入力） */
  title: string;
  /** ソースプラットフォーム */
  source: SourcePlatform;
  /** メッセージ配列 */
  messages: Message[];
  /** ユーザーが付けたタグ */
  tags: string[];
  /** ユーザーによるメモ */
  note: string;
}

/**
 * フォームの状態を管理するクラス
 *
 * @example
 * ```typescript
 * const container = document.getElementById('form-section')!;
 * const form = new FormManager(container);
 *
 * form.setData({
 *   title: 'React Hooks について',
 *   source: 'gemini',
 *   messages: [...],
 *   tags: ['React', 'hooks'],
 *   note: 'useMemoの使い方を整理'
 * });
 *
 * const request = form.toSaveRequest();
 * ```
 */
export class FormManager {
  /** フォームを表示するコンテナ要素 */
  private container: HTMLElement;

  /** 現在のフォームデータ */
  private data: ConversationFormData | null = null;

  /** タグ管理インスタンス */
  private tagManager: TagManager | null = null;

  /** タイトル入力要素 */
  private titleInput: HTMLInputElement | null = null;

  /** メモ入力要素 */
  private noteTextarea: HTMLTextAreaElement | null = null;

  /**
   * FormManagerを初期化する
   *
   * @param container - フォームを表示するコンテナ要素
   */
  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * フォームにデータを設定する
   *
   * @param data - 表示する対話データ
   */
  setData(data: ConversationFormData): void {
    this.data = { ...data };
    this.render();
  }

  /**
   * 現在のフォームデータを取得する
   *
   * @returns 現在のフォームデータ（設定されていなければnull）
   */
  getData(): ConversationFormData | null {
    if (!this.data) {
      return null;
    }

    // 入力フィールドから最新の値を取得
    return {
      ...this.data,
      title: this.titleInput?.value ?? this.data.title,
      note: this.noteTextarea?.value ?? this.data.note,
      tags: this.tagManager?.getTags() ?? this.data.tags,
    };
  }

  /**
   * フォームデータをAPI保存リクエスト形式に変換する
   *
   * @returns SaveConversationRequest形式のデータ（データがなければnull）
   */
  toSaveRequest(): SaveConversationRequest | null {
    const data = this.getData();
    if (!data) {
      return null;
    }

    return {
      title: data.title,
      source: data.source,
      messages: data.messages,
      tags: data.tags,
      note: data.note || undefined,
    };
  }

  /**
   * フォームのバリデーションを行う
   *
   * @returns バリデーション結果（エラーがあればエラーメッセージ）
   */
  validate(): { valid: boolean; error?: string } {
    const data = this.getData();

    if (!data) {
      return { valid: false, error: '対話データがありません' };
    }

    if (!data.title.trim()) {
      return { valid: false, error: 'タイトルを入力してください' };
    }

    if (data.messages.length === 0) {
      return { valid: false, error: '保存するメッセージがありません' };
    }

    return { valid: true };
  }

  /**
   * タイトルを更新する
   *
   * @param title - 新しいタイトル
   */
  updateTitle(title: string): void {
    if (this.titleInput) {
      this.titleInput.value = title;
    }
    if (this.data) {
      this.data.title = title;
    }
  }

  /**
   * フォームを描画する
   */
  private render(): void {
    if (!this.data) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="form-section">
        <div class="field">
          <label class="field-label" for="title-input">タイトル</label>
          <input
            type="text"
            id="title-input"
            class="input-text"
            placeholder="対話のタイトルを入力"
            value="${escapeHtml(this.data.title)}"
          />
        </div>

        <div class="field">
          <label class="field-label" for="note-textarea">メモ</label>
          <textarea
            id="note-textarea"
            class="input-textarea"
            placeholder="なぜこの対話を保存したか、重要なポイントなどをメモ"
          >${escapeHtml(this.data.note)}</textarea>
        </div>

        <div class="field">
          <label class="field-label">タグ</label>
          <div id="tag-container"></div>
        </div>
      </div>
    `;

    // 入力要素の参照を取得
    this.titleInput = this.container.querySelector<HTMLInputElement>('#title-input');
    this.noteTextarea = this.container.querySelector<HTMLTextAreaElement>('#note-textarea');

    // タグマネージャーを初期化
    const tagContainer = this.container.querySelector<HTMLElement>('#tag-container');
    if (tagContainer) {
      this.tagManager = new TagManager(tagContainer, this.data.tags);
    }
  }
}
