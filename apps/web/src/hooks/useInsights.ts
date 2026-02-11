/**
 * @fileoverview 洞察データの取得・管理フック
 *
 * 対話詳細ページとスペース詳細ページで共通の洞察取得ロジックを提供する。
 * APIエンドポイントを引数で受け取り、取得・ローディング・エラー状態を管理する。
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Insight } from '@zenn-hackathon04/shared';

interface UseInsightsReturn {
  /** 洞察一覧 */
  insights: Insight[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラー発生有無 */
  hasError: boolean;
  /** 洞察一覧を再取得する */
  refetch: () => void;
}

/**
 * 洞察データの取得・管理フック
 *
 * 指定されたAPIエンドポイントから洞察一覧を取得し、状態を管理する。
 * 対話詳細（/api/conversations/:id/insights）とスペース詳細（/api/spaces/:id/insights）の
 * 両方で使用できる汎用フック。
 *
 * @param apiEndpoint - 洞察取得APIのURL（例: `/api/conversations/xxx/insights`）
 * @returns 洞察データと状態管理オブジェクト
 */
export function useInsights(apiEndpoint: string): UseInsightsReturn {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const response = await fetch(apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInsights(data.data.insights);
        } else {
          setHasError(true);
        }
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    isLoading,
    hasError,
    refetch: fetchInsights,
  };
}
