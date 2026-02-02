/**
 * @fileoverview 思考再開パネルコンポーネント
 *
 * Geminiとの対話UIパネル。Sprint 1ではプレースホルダーとして表示。
 * Sprint 2で実際のGemini連携を実装予定。
 * デザイン: thinkresume.pen のrightColumn（Geminiと対話）を参照
 */
import { Sparkles, Send } from 'lucide-react';

/**
 * 思考再開パネルコンポーネント
 *
 * Sprint 2で実際のGemini API連携を実装予定。
 */
export function ThinkResumePanel() {
  return (
    <div
      className="flex h-full flex-col rounded-sm"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center gap-2 p-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <Sparkles
          className="h-[18px] w-[18px]"
          style={{ color: 'var(--red-primary)' }}
        />
        <h2
          className="text-base font-semibold"
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            color: 'var(--black-primary)',
          }}
        >
          Geminiと対話
        </h2>
      </div>

      {/* チャットエリア */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-5">
        <Sparkles className="h-8 w-8" style={{ color: 'var(--gray-400)' }} />
        <p className="text-sm" style={{ color: 'var(--gray-700)' }}>
          思考再開機能は Sprint 2 で実装予定
        </p>
        <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
          保存した対話をコンテキストとして Gemini と会話できます
        </p>
      </div>

      {/* 入力エリア（無効化） */}
      <div
        className="flex items-center gap-3 p-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div
          className="flex h-10 flex-1 items-center rounded-sm px-3"
          style={{
            backgroundColor: 'var(--bg-page)',
            border: '1px solid var(--border)',
          }}
        >
          <span className="text-sm" style={{ color: 'var(--gray-400)' }}>
            メッセージを入力...
          </span>
        </div>
        <button
          type="button"
          disabled
          className="flex h-10 w-10 items-center justify-center rounded-sm opacity-50"
          style={{ backgroundColor: 'var(--red-primary)' }}
          title="Sprint 2 で実装予定"
        >
          <Send className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
