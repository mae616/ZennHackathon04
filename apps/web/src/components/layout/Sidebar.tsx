/**
 * @fileoverview サイドバーナビゲーションコンポーネント
 *
 * ThinkResumeのメインナビゲーション。対話一覧、スペース、設定へのリンクを提供する。
 * デザイン: thinkresume.pen の Sidebar を参照
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  LayoutGrid,
  Settings,
  type LucideIcon,
} from 'lucide-react';

/** ナビゲーションアイテムの型定義 */
interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

/** メニュー項目の定義 */
const navItems: NavItem[] = [
  { href: '/', icon: MessageSquare, label: '対話一覧' },
  { href: '/spaces', icon: LayoutGrid, label: 'スペース' },
  { href: '/settings', icon: Settings, label: '設定' },
];

/**
 * サイドバーコンポーネント
 *
 * ThinkResumeロゴとメインナビゲーションを表示する。
 * 現在のパスに応じてアクティブ状態を表示する。
 */
export function Sidebar() {
  const pathname = usePathname();

  /**
   * パスがアクティブかどうかを判定する
   * ルート（/）は完全一致、それ以外は前方一致で判定
   */
  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="flex h-full w-60 flex-col gap-8 border-r py-8 px-6"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* ロゴ */}
      <div className="flex items-center gap-2.5">
        <div
          className="h-7 w-7"
          style={{ backgroundColor: 'var(--red-primary)' }}
        />
        <span
          className="text-lg font-semibold"
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            color: 'var(--black-primary)',
          }}
        >
          ThinkResume
        </span>
      </div>

      {/* ナビゲーション */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="flex items-center gap-3 rounded px-4 py-3 transition-colors"
              style={{
                backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
              }}
            >
              {/* アクティブインジケーター */}
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: active
                    ? 'var(--red-primary)'
                    : 'transparent',
                }}
              />
              <item.icon
                className="h-[18px] w-[18px]"
                style={{
                  color: active ? 'var(--black-primary)' : 'var(--gray-700)',
                }}
              />
              <span
                className="text-sm"
                style={{
                  fontWeight: active ? 500 : 400,
                  color: active ? 'var(--black-primary)' : 'var(--gray-700)',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
