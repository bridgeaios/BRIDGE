export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  contextLength: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
  model: string;
}

export class FreeLLMAPIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = 'http://localhost:31415', apiKey: string = '') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async listModels(): Promise<AIModel[]> {
    const response = await fetch(`${this.baseUrl}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to list models');
    const data = await response.json();
    return data.data || [];
  }

  async chat(messages: AIMessage[], options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    tools?: any[];
    toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  } = {}): Promise<AIResponse | ReadableStream<AIStreamChunk>> {
    const { model = 'auto', temperature = 0.7, maxTokens = 2048, stream = false, tools, toolChoice } = options;

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chat completion failed: ${error}`);
    }

    if (stream) {
      return this.createStream(response);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage,
    };
  }

  private async *createStream(response: Response): AsyncGenerator<AIStreamChunk> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', done: true, model: '' };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              yield { content, done: false, model: parsed.model || '' };
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }

  async transcribe(audioBlob: Blob, mimeType: string = 'audio/webm'): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch(`${this.baseUrl}/v1/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Transcription failed');
    const data = await response.json();
    return data.text || '';
  }

  async generateEmbedding(text: string, model: string = 'text-embedding-3-small'): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text, model }),
    });

    if (!response.ok) throw new Error('Embedding generation failed');
    const data = await response.json();
    return data.data[0]?.embedding || [];
  }
}

export const aiGateway = new FreeLLMAPIClient(
  process.env.FREELLAPI_URL || 'http://localhost:31415',
  process.env.FREELLAPI_KEY || ''
);