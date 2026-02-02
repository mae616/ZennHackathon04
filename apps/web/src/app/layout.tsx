/**
 * @fileoverview ルートレイアウト
 *
 * ThinkResume Webアプリの共通レイアウト。
 * サイドバー + メインコンテンツエリアの構成。
 */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ThinkResume - LLMとの対話を、資産に変える',
  description:
    'LLMとの対話から重要なやり取りをキャプチャし、後から思考を再開できるAIエージェント',
};

/**
 * ルートレイアウトコンポーネント
 *
 * サイドバーとメインコンテンツエリアを配置。
 * 全ページで共通のレイアウトを提供する。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} flex h-screen antialiased`}>
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
