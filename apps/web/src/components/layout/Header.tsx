/**
 * @fileoverview ページヘッダーコンポーネント
 *
 * ページタイトル、サブタイトル、アクション領域を表示する。
 * デザイン: thinkresume.pen の pageHeader を参照
 */
import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  /** 右側アクション領域（検索バー等のClient Componentを挿入） */
  actions?: ReactNode;
}

/**
 * ページヘッダーコンポーネント
 *
 * @param title - ページタイトル
 * @param subtitle - サブタイトル（省略可）
 * @param actions - 右側アクション領域
 */
export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="flex items-center justify-between">
      {/* 左側: タイトル・サブタイトル */}
      <div className="flex flex-col gap-1">
        <h1
          className="text-3xl font-semibold"
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            color: 'var(--black-primary)',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--gray-700)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* 右側: アクション領域 */}
      {actions && <div>{actions}</div>}
    </header>
  );
}
