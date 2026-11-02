import { useState, useCallback, useRef } from 'react';
import { aiGateway, AIMessage, AIStreamChunk } from './gateway';

export interface UseStreamingAIOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export function useStreamingAI(options: UseStreamingAIOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [accumulatedResponse, setAccumulatedResponse] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    messages: AIMessage[],
    model?: string
  ) => {
    if (isStreaming) return;

    setIsStreaming(true);
    setAccumulatedResponse('');
    abortControllerRef.current = new AbortController();

    try {
      const stream = await aiGateway.chat(messages, { model, stream: true }) as ReadableStream<AIStreamChunk>;
      const reader = stream.getReader();

      while (true) {
        if (abortControllerRef.current?.signal.aborted) break;

        const { done, value } = await reader.read();
        if (done) break;

        if (value && !value.done) {
          setAccumulatedResponse(prev => prev + value.content);
          options.onChunk?.(value.content);
        }
      }

      options.onComplete?.(accumulatedResponse);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        options.onError?.(error);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [isStreaming, options, accumulatedResponse]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    accumulatedResponse,
    sendMessage,
    abort,
  };
}