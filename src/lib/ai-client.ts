import type { Message, ChatConfig, StreamCallbacks, TokenUsage } from '@/types';

interface ChatRequest {
  messages: Message[];
  config: ChatConfig;
  editorContext?: string;
}

export class AIClient {
  private abortController: AbortController | null = null;

  async streamChat(
    request: ChatRequest,
    callbacks: StreamCallbacks
  ): Promise<TokenUsage | null> {
    this.abort();
    this.abortController = new AbortController();

    const apiMessages = [
      { role: 'system' as const, content: request.config.systemPrompt },
      ...request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
    ];

    if (request.editorContext) {
      const lastUserIdx = apiMessages.length - 1;
      if (apiMessages[lastUserIdx]?.role === 'user') {
        apiMessages[lastUserIdx] = {
          ...apiMessages[lastUserIdx],
          content: `[Current editor context]:\n\`\`\`\n${request.editorContext}\n\`\`\`\n\n${apiMessages[lastUserIdx].content}`,
        };
      }
    }

    let fullText = '';
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: request.config.model,
          temperature: request.config.temperature,
          maxTokens: request.config.maxTokens,
          apiUrl: request.config.apiUrl,
          apiKey: request.config.apiKey,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `API error ${response.status}: ${errorBody || response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error('Response body is null — streaming not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let usage: TokenUsage | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              callbacks.onChunk(delta);
            }
            if (json.usage) {
              usage = {
                promptTokens: json.usage.prompt_tokens || 0,
                completionTokens: json.usage.completion_tokens || 0,
                totalTokens: json.usage.total_tokens || 0,
              };
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      callbacks.onComplete(fullText);
      return usage;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        callbacks.onComplete(fullText || '');
        return null;
      }
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks.onError(err);
      return null;
    } finally {
      this.abortController = null;
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async checkConnection(config?: ChatConfig): Promise<{ connected: boolean; latency: number }> {
    const start = performance.now();
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'ping' }],
          model: config?.model || 'test',
          maxTokens: 1,
          temperature: 0,
          apiUrl: config?.apiUrl,
          apiKey: config?.apiKey,
          healthCheck: true,
        }),
        signal: AbortSignal.timeout(5000),
      });
      const latency = Math.round(performance.now() - start);
      return { connected: res.ok || res.status === 200, latency };
    } catch {
      return { connected: false, latency: Math.round(performance.now() - start) };
    }
  }
}

export const aiClient = new AIClient();
