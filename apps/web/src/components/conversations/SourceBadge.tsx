/**
 * @fileoverview ソースバッジコンポーネント
 *
 * 対話のソースプラットフォーム（ChatGPT/Claude/Gemini）を表示するバッジ。
 * 各プラットフォームに応じた色で表示する。
 */
import type { SourcePlatform } from '@zenn-hackathon04/shared';

/** 各プラットフォームの表示設定 */
const platformConfig: Record<
  SourcePlatform,
  { label: string; bgColor: string; textColor: string }
> = {
  chatgpt: {
    label: 'ChatGPT',
    bgColor: '#E8F5E9', // 緑系
    textColor: '#2E7D32',
  },
  claude: {
    label: 'Claude',
    bgColor: '#FFF3E0', // オレンジ系
    textColor: '#E65100',
  },
  gemini: {
    label: 'Gemini',
    bgColor: '#E3F2FD', // 青系
    textColor: '#1565C0',
  },
};

interface SourceBadgeProps {
  source: SourcePlatform;
}

/**
 * ソースバッジコンポーネント
 *
 * @param source - 対話のソースプラットフォーム
 */
export function SourceBadge({ source }: SourceBadgeProps) {
  const config = platformConfig[source];

  return (
    <span
      className="rounded px-2 py-1 text-xs font-medium"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      {config.label}
    </span>
  );
}
