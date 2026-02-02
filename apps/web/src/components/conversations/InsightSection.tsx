/**
 * @fileoverview 洞察セクションコンポーネント
 *
 * Geminiとの対話から保存したQ&A形式の洞察を表示する。
 * MVP段階ではプレースホルダー表示。実際の洞察機能はSprint 2で実装予定。
 * デザイン: thinkresume.pen の追加した洞察セクションを参照
 */
import { Lightbulb } from 'lucide-react';

/**
 * 洞察セクションコンポーネント
 *
 * Sprint 2で実際の洞察データを受け取るようにpropsを拡張予定。
 */
export function InsightSection() {
  // TODO: Sprint 2で洞察機能実装後、propsからinsights配列を受け取る
  const insightCount = 0;

  return (
    <section
      className="flex flex-col gap-4 rounded-sm p-6"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb
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
            追加した洞察
          </h2>
        </div>
        <span
          className="rounded-sm px-2 py-1 text-xs"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--gray-700)',
          }}
        >
          {insightCount}件
        </span>
      </div>

      {/* 洞察リスト（Sprint 2で実装） */}
      <div
        className="rounded-sm p-4 text-center text-sm"
        style={{
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--gray-700)',
        }}
      >
        洞察機能は Sprint 2 で実装予定
      </div>
    </section>
  );
}
