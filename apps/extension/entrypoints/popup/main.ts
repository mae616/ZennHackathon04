/**
 * @fileoverview ポップアップUIのメインエントリポイント
 *
 * Chrome拡張のポップアップウィンドウを管理する。
 * - Content Scriptから対話データを取得
 * - フォームで編集可能にする
 * - 保存ボタンでAPIに送信
 *
 * @remarks
 * 対話の取得は browser.tabs.sendMessage を使用してContent Scriptに問い合わせる。
 * 保存は POST /api/conversations を呼び出す。
 */

import './style.css';
import { FormManager, type ConversationFormData } from './components/form';
import { showLoading, hideLoading, updateLoadingMessage } from './components/loading';
import { escapeHtml } from './utils/escape';
import type { Message, SourcePlatform, SaveConversationRequest } from '@zenn-hackathon04/shared';

/** APIエンドポイントのベースURL（環境変数から取得、デフォルトはローカル開発用） */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Content Scriptからの応答型
 * content.ts の CaptureResponse と同じ構造
 */
interface CaptureResponse {
  success: boolean;
  platform: SourcePlatform | null;
  data?: {
    success: true;
    messages: Message[];
    title: string | null;
  };
  error?: string;
}

/** フォームマネージャー */
let formManager: FormManager | null = null;

/**
 * 閉じるボタンのSVGアイコン
 */
const CLOSE_ICON = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
`;

/**
 * エラーアイコンのSVG
 */
const ERROR_ICON = `
  <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
`;

/**
 * アプリケーションのルートHTMLを生成する
 *
 * @returns アプリケーションのHTML文字列
 */
function createAppHtml(): string {
  return `
    <!-- ヘッダー -->
    <header class="header">
      <div class="logo-group">
        <div class="logo-mark"></div>
        <span class="logo-text">ThinkResume</span>
      </div>
      <button type="button" class="close-btn" id="close-btn" title="閉じる">
        ${CLOSE_ICON}
      </button>
    </header>

    <!-- コンテンツエリア -->
    <main class="content" id="content">
      <!-- ステータスバー -->
      <div class="status-bar" id="status-bar">
        <span class="status-dot status-dot--loading" id="status-dot"></span>
        <span class="status-text" id="status-text">対話を取得中...</span>
      </div>

      <!-- フォームセクション（データ取得後に表示） -->
      <div id="form-container"></div>
    </main>

    <!-- フッター -->
    <footer class="footer" id="footer">
      <button type="button" class="btn btn--secondary" id="cancel-btn">
        キャンセル
      </button>
      <button type="button" class="btn btn--primary" id="save-btn" disabled>
        保存する
      </button>
    </footer>
  `;
}

/**
 * エラー画面を表示する
 *
 * @param title - エラータイトル
 * @param description - エラーの詳細説明
 * @param showRetry - リトライボタンを表示するか
 */
function showError(title: string, description: string, showRetry = true): void {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="error-message">
      ${ERROR_ICON}
      <h2 class="error-title">${escapeHtml(title)}</h2>
      <p class="error-description">${escapeHtml(description)}</p>
      ${showRetry ? '<button type="button" class="btn btn--primary error-retry" id="retry-btn">再試行</button>' : ''}
    </div>
  `;

  // リトライボタンのイベント設定
  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      init();
    });
  }

  // フッターのボタンを無効化
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement | null;
  if (saveBtn) {
    saveBtn.disabled = true;
  }
}

/**
 * ステータスバーを更新する
 *
 * @param status - 'loading' | 'success' | 'error'
 * @param message - 表示するメッセージ
 */
function updateStatus(status: 'loading' | 'success' | 'error', message: string): void {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  if (dot) {
    dot.className = `status-dot status-dot--${status}`;
  }

  if (text) {
    text.textContent = message;
  }
}

/**
 * アクティブなタブにメッセージを送信して対話を取得する
 *
 * @returns Content Scriptからの応答
 */
async function captureConversation(): Promise<CaptureResponse> {
  // アクティブなタブを取得
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return {
      success: false,
      platform: null,
      error: 'アクティブなタブが見つかりません',
    };
  }

  try {
    // Content Scriptにキャプチャリクエストを送信
    const response = await browser.tabs.sendMessage(tab.id, {
      type: 'CAPTURE_CONVERSATION',
    });

    return response as CaptureResponse;
  } catch (err) {
    // Content Scriptが読み込まれていない場合など
    console.error('[ThinkResume] Failed to send message to content script:', err);
    return {
      success: false,
      platform: null,
      error: 'このページでは対話をキャプチャできません。Gemini（gemini.google.com）のページで使用してください。',
    };
  }
}

/**
 * 対話をAPIに保存する
 *
 * @param request - 保存リクエストデータ
 * @returns 保存結果（成功時はid、失敗時はnull）
 */
async function saveConversation(request: SaveConversationRequest): Promise<{ id: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message ?? '保存に失敗しました');
    }

    return { id: data.data.id };
  } catch (err) {
    console.error('[ThinkResume] Failed to save conversation:', err);
    throw err;
  }
}

/**
 * 保存ボタンのクリックハンドラ
 */
async function handleSave(): Promise<void> {
  if (!formManager) return;

  // バリデーション
  const validation = formManager.validate();
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  const request = formManager.toSaveRequest();
  if (!request) return;

  // 保存ボタンを無効化
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement | null;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';
  }

  showLoading('保存中...');

  try {
    const result = await saveConversation(request);

    if (result) {
      updateLoadingMessage('保存しました！');

      // 少し待ってからポップアップを閉じる
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  } catch (err) {
    hideLoading();

    const message = err instanceof Error ? err.message : '保存に失敗しました';
    alert(`エラー: ${message}`);

    // ボタンを復元
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '保存する';
    }
  }
}

/**
 * キャンセルボタンのクリックハンドラ
 */
function handleCancel(): void {
  window.close();
}

/**
 * 閉じるボタンのクリックハンドラ
 */
function handleClose(): void {
  window.close();
}

/**
 * イベントリスナーを設定する
 */
function setupEventListeners(): void {
  // 閉じるボタン
  const closeBtn = document.getElementById('close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', handleClose);
  }

  // キャンセルボタン
  const cancelBtn = document.getElementById('cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', handleCancel);
  }

  // 保存ボタン
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
  }
}

/**
 * フォームを初期化して表示する
 *
 * @param data - 表示する対話データ
 */
function initializeForm(data: ConversationFormData): void {
  const formContainer = document.getElementById('form-container');
  if (!formContainer) return;

  formManager = new FormManager(formContainer);
  formManager.setData(data);

  // 保存ボタンを有効化
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement | null;
  if (saveBtn) {
    saveBtn.disabled = false;
  }
}

/**
 * アプリケーションを初期化する
 */
async function init(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  // ルートHTMLを設定
  app.innerHTML = createAppHtml();

  // イベントリスナーを設定
  setupEventListeners();

  // 対話を取得
  updateStatus('loading', '対話を取得中...');

  try {
    const response = await captureConversation();

    if (!response.success || !response.data) {
      updateStatus('error', 'キャプチャに失敗');
      showError(
        'キャプチャに失敗しました',
        response.error ?? '不明なエラーが発生しました',
        true
      );
      return;
    }

    // 成功：フォームを初期化
    updateStatus('success', '編集してください');

    const formData: ConversationFormData = {
      title: response.data.title ?? '無題の対話',
      source: response.platform!,
      messages: response.data.messages,
      tags: [],
      note: '',
    };

    initializeForm(formData);
  } catch (err) {
    console.error('[ThinkResume] Initialization error:', err);
    updateStatus('error', 'エラーが発生しました');
    showError(
      'エラーが発生しました',
      err instanceof Error ? err.message : '不明なエラー',
      true
    );
  }
}

// アプリケーションを起動
init();
