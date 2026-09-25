import {
  AIProvider,
  GenerateTextParams,
  GenerateTextResult,
  TestConnectionResult,
} from '../types';

export class OpenRouterProvider implements AIProvider {
  readonly providerKey = 'openrouter' as const;
  readonly displayName = 'OpenRouter';
  readonly defaultModel = 'meta-llama/llama-3.2-3b-instruct';
  readonly supportedModels = [
    'meta-llama/llama-3.2-3b-instruct',
    'google/gemini-2.5-flash',
    'mistralai/mistral-7b-instruct',
    'anthropic/claude-3-haiku',
  ];

  private sanitizeModel(model?: string): string {
    const raw = (model || '').trim();
    if (!raw) return this.defaultModel;
    return raw.replace(/:free$/, '');
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    const { messages, systemPrompt, model, apiKey, temperature = 0.7, maxTokens = 800, signal } = params;

    const formattedMessages: { role: string; content: string }[] = [];

    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        formattedMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

    const activeModel = this.sanitizeModel(model);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://hennabyaayesha.com',
        'X-Title': 'Henna by Aayesha AI Assistant',
      },
      body: JSON.stringify({
        model: activeModel,
        messages: formattedMessages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `OpenRouter API error (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.error?.message || errorMsg;
      } catch {
        // use default
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('OpenRouter returned an empty response choice.');
    }

    return {
      text,
      providerKey: this.providerKey,
      model: activeModel,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    };
  }

  async testConnection(apiKey: string, model: string): Promise<TestConnectionResult> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const activeModel = this.sanitizeModel(model);

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://hennabyaayesha.com',
          'X-Title': 'Henna by Aayesha AI Assistant',
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text();
        let message = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(errText);
          message = parsed.error?.message || message;
        } catch {
          // ignore
        }
        return {
          success: false,
          latencyMs,
          error: message,
        };
      }

      return {
        success: true,
        latencyMs,
        message: 'Successfully connected to OpenRouter',
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
      return {
        success: false,
        latencyMs,
        error: errorMsg,
      };
    }
  }
}

export const openRouterProvider = new OpenRouterProvider();
