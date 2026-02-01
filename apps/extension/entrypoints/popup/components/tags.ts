/**
 * @fileoverview タグ編集UIコンポーネント
 *
 * タグの追加・削除を管理するUIコンポーネント。
 * 既存タグの表示、新規タグの追加入力、タグの削除機能を提供する。
 */

/**
 * タグ変更時のコールバック型
 */
export type TagChangeCallback = (tags: string[]) => void;

/**
 * タグ編集UIの状態を管理するクラス
 *
 * @example
 * ```typescript
 * const container = document.getElementById('tag-container')!;
 * const tagManager = new TagManager(container, ['React', 'TypeScript']);
 * tagManager.onTagChange((tags) => console.log('Tags:', tags));
 * ```
 */
export class TagManager {
  /** タグを表示するコンテナ要素 */
  private container: HTMLElement;

  /** 現在のタグリスト */
  private tags: string[];

  /** タグ変更時のコールバック関数 */
  private changeCallback: TagChangeCallback | null = null;

  /** タグ追加の入力モード中かどうか */
  private isAddingTag = false;

  /**
   * TagManagerを初期化する
   *
   * @param container - タグを表示するコンテナ要素
   * @param initialTags - 初期タグリスト
   */
  constructor(container: HTMLElement, initialTags: string[] = []) {
    this.container = container;
    this.tags = [...initialTags];
    this.render();
  }

  /**
   * タグ変更時のコールバックを設定する
   *
   * @param callback - タグ変更時に呼び出される関数
   */
  onTagChange(callback: TagChangeCallback): void {
    this.changeCallback = callback;
  }

  /**
   * 現在のタグリストを取得する
   *
   * @returns 現在のタグ配列
   */
  getTags(): string[] {
    return [...this.tags];
  }

  /**
   * タグを設定する（外部からの更新用）
   *
   * @param tags - 設定するタグ配列
   */
  setTags(tags: string[]): void {
    this.tags = [...tags];
    this.render();
  }

  /**
   * タグを追加する
   *
   * @param tag - 追加するタグ
   * @returns 追加に成功したらtrue
   */
  addTag(tag: string): boolean {
    const trimmed = tag.trim();

    // 空文字や重複はスキップ
    if (!trimmed || this.tags.includes(trimmed)) {
      return false;
    }

    this.tags.push(trimmed);
    this.notifyChange();
    this.render();
    return true;
  }

  /**
   * タグを削除する
   *
   * @param tag - 削除するタグ
   */
  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index !== -1) {
      this.tags.splice(index, 1);
      this.notifyChange();
      this.render();
    }
  }

  /**
   * タグ入力モードを開始する
   */
  private startAddingTag(): void {
    this.isAddingTag = true;
    this.render();

    // 入力フィールドにフォーカス
    setTimeout(() => {
      const input = this.container.querySelector<HTMLInputElement>('.tag-input');
      input?.focus();
    }, 0);
  }

  /**
   * タグ入力モードを終了する
   */
  private finishAddingTag(): void {
    this.isAddingTag = false;
    this.render();
  }

  /**
   * 変更を通知する
   */
  private notifyChange(): void {
    if (this.changeCallback) {
      this.changeCallback([...this.tags]);
    }
  }

  /**
   * コンテナの内容を再描画する
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'tag-container';

    // 既存タグを表示
    this.tags.forEach((tag) => {
      const tagElement = this.createTagElement(tag);
      this.container.appendChild(tagElement);
    });

    // タグ追加UI
    if (this.isAddingTag) {
      const input = this.createTagInput();
      this.container.appendChild(input);
    } else {
      const addButton = this.createAddButton();
      this.container.appendChild(addButton);
    }
  }

  /**
   * タグ要素を作成する
   *
   * @param tag - タグ文字列
   * @returns タグのHTML要素
   */
  private createTagElement(tag: string): HTMLElement {
    const element = document.createElement('span');
    element.className = 'tag';

    const text = document.createElement('span');
    text.textContent = tag;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'tag-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'タグを削除';
    removeBtn.addEventListener('click', () => this.removeTag(tag));

    element.appendChild(text);
    element.appendChild(removeBtn);

    return element;
  }

  /**
   * タグ追加ボタンを作成する
   *
   * @returns 追加ボタンのHTML要素
   */
  private createAddButton(): HTMLElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'add-tag-btn';
    button.innerHTML = '+ 追加';
    button.addEventListener('click', () => this.startAddingTag());
    return button;
  }

  /**
   * タグ入力フィールドを作成する
   *
   * @returns 入力フィールドのHTML要素
   */
  private createTagInput(): HTMLElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tag-input';
    input.placeholder = 'タグ名';

    // Enterキーで追加
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = input.value.trim();
        if (value) {
          this.addTag(value);
        } else {
          this.finishAddingTag();
        }
      } else if (e.key === 'Escape') {
        this.finishAddingTag();
      }
    });

    // フォーカスが外れたら追加して終了
    input.addEventListener('blur', () => {
      const value = input.value.trim();
      if (value) {
        this.addTag(value);
      }
      this.finishAddingTag();
    });

    return input;
  }
}
