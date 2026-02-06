/**
 * @fileoverview 思考再開パネルコンポーネント
 *
 * Geminiとの対話UIパネル。保存した対話をコンテキストとして
 * Geminiと会話し、思考を再開・深掘りできる。
 *
 * デザイン: thinkresume.pen のrightColumn（Geminiと対話）を参照
 *
 * RDD参照:
 * - doc/input/rdd.md §思考再開機能
 * - doc/input/rdd.md §Gemini対話のUIパターン
 */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import type { Conversation } from '@zenn-hackathon04/shared';
import { generateGreetingMessage, type ThinkResumeContext } from '@/lib/vertex/types';

/**
 * チャットメッセージの型
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface ThinkResumePanelProps {
  /** 対話データ（コンテキスト用） */
  conversation: Conversation;
}

/**
 * メッセージバブルコンポーネント（チャットUI用）
 *
 * Geminiとの対話メッセージを表示する。
 * user: 右寄せ黒背景、model: 左寄せ赤背景で区別。
 */
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 ${
          isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
        style={{
          backgroundColor: isUser ? 'var(--black-primary)' : 'var(--red-50, #fef2f2)',
          color: isUser ? 'white' : 'var(--black-primary)',
        }}
      >
        <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
      </div>
    </div>
  );
}

/**
 * ストリーミング中の表示コンポーネント
 */
function StreamingIndicator({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[85%] rounded-lg rounded-bl-sm px-4 py-3"
        style={{
          backgroundColor: 'var(--red-50, #fef2f2)',
          color: 'var(--black-primary)',
        }}
      >
        <p className="whitespace-pre-wrap break-words text-sm">
          {content}
          <span className="ml-1 inline-block animate-pulse">|</span>
        </p>
      </div>
    </div>
  );
}

/**
 * 思考再開パネルコンポーネント
 *
 * 保存した対話をコンテキストとしてGeminiと会話できる。
 * ストリーミング表示、初回挨拶、ローディング・エラー状態を管理。
 *
 * @param conversation - 対話データ
 */
export function ThinkResumePanel({ conversation }: ThinkResumePanelProps) {
  /** チャット履歴 */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** 入力中のメッセージ */
  const [input, setInput] = useState('');
  /** ストリーミング中のコンテンツ */
  const [streamingContent, setStreamingContent] = useState('');
  /** ローディング状態 */
  const [isLoading, setIsLoading] = useState(false);
  /** エラー状態 */
  const [error, setError] = useState<string | null>(null);
  /** 初期化済みフラグ */
  const [isInitialized, setIsInitialized] = useState(false);

  /** メッセージリストのスクロールコンテナ */
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * メッセージリストの末尾にスクロールする
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * 初回マウント時に挨拶メッセージを生成
   */
  useEffect(() => {
    if (isInitialized) return;

    // 対話コンテキストを構築
    const context: ThinkResumeContext = {
      conversationSummary: conversation.messages
        .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n\n'),
      title: conversation.title,
      note: conversation.note,
    };

    // 初回挨拶メッセージを生成
    const greeting = generateGreetingMessage(context);
    setMessages([
      {
        id: 'greeting',
        role: 'model',
        content: greeting,
      },
    ]);
    setIsInitialized(true);
  }, [conversation, isInitialized]);

  /**
   * メッセージが追加されたらスクロール
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  /**
   * メッセージを送信してGeminiからの応答を取得する
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    setStreamingContent('');

    try {
      // チャット履歴を準備（挨拶メッセージを除く）
      const chatHistory = messages
        .filter((m) => m.id !== 'greeting')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // ストリーミングAPIを呼び出し
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          userMessage: trimmedInput,
          chatHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'APIエラーが発生しました');
      }

      // ストリーミングレスポンスを処理
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ストリーミングレスポンスを取得できませんでした');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // ストリーミング完了
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulatedContent += parsed.text;
                setStreamingContent(accumulatedContent);
              }
            } catch {
              // JSONパースエラーは無視（不完全なチャンクの可能性）
            }
          }
        }
      }

      // ストリーミング完了後、メッセージリストに追加
      if (accumulatedContent) {
        const assistantMessage: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: accumulatedContent,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  /**
   * チャットをリセットする
   */
  const handleReset = () => {
    setIsInitialized(false);
    setMessages([]);
    setInput('');
    setStreamingContent('');
    setError(null);
  };

  return (
    <div
      className="flex h-full flex-col rounded-sm"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between gap-2 p-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
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
        {messages.length > 1 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors hover:opacity-70"
            style={{ color: 'var(--gray-500)' }}
            title="チャットをリセット"
          >
            <RotateCcw className="h-3 w-3" />
            リセット
          </button>
        )}
      </div>

      {/* チャットエリア */}
      <div
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="Geminiとの対話履歴"
      >
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {/* ストリーミング中の表示 */}
        {isLoading && streamingContent && (
          <StreamingIndicator content={streamingContent} />
        )}

        {/* ローディング表示（ストリーミング開始前） */}
        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div
              className="flex items-center gap-2 rounded-lg rounded-bl-sm px-4 py-3"
              style={{
                backgroundColor: 'var(--red-50, #fef2f2)',
                color: 'var(--gray-500)',
              }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">考え中...</span>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div
            className="flex items-start gap-2 rounded-lg p-3"
            style={{
              backgroundColor: 'var(--red-50, #fef2f2)',
              border: '1px solid var(--red-primary)',
            }}
          >
            <AlertCircle
              className="h-4 w-4 flex-shrink-0 mt-0.5"
              style={{ color: 'var(--red-primary)' }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--red-primary)' }}>
                エラーが発生しました
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--gray-600)' }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* スクロール位置用の参照要素 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 p-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          disabled={isLoading}
          aria-label="Geminiへのメッセージ"
          className="flex h-10 flex-1 rounded-sm px-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: 'var(--bg-page)',
            border: '1px solid var(--border)',
            color: 'var(--black-primary)',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: 'var(--red-primary)' }}
          title="送信"
          aria-label={isLoading ? '送信中...' : 'メッセージを送信'}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Send className="h-4 w-4 text-white" />
          )}
        </button>
      </form>
    </div>
  );
}
