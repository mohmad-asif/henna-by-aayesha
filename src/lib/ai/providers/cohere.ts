import {
  AIProvider,
  GenerateTextParams,
  GenerateTextResult,
  TestConnectionResult,
} from '../types';

export class CohereProvider implements AIProvider {
  readonly providerKey = 'cohere' as const;
  readonly displayName = 'Cohere';
  readonly defaultModel = 'command-r-plus-08-2024';
  readonly supportedModels = [
    'command-r-plus-08-2024',
    'command-r-08-2024',
  ];

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

    const endpoint = 'https://api.cohere.com/v2/chat';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || this.defaultModel,
        messages: formattedMessages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Cohere API error (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.message || parsed.error?.message || errorMsg;
      } catch {
        // use default
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const text = data.message?.content?.[0]?.text;

    if (!text) {
      throw new Error('Cohere returned an empty response text.');
    }

    return {
      text,
      providerKey: this.providerKey,
      model: model || this.defaultModel,
      usage: {
        promptTokens: data.usage?.tokens?.input_tokens,
        completionTokens: data.usage?.tokens?.output_tokens,
        totalTokens:
          (data.usage?.tokens?.input_tokens || 0) + (data.usage?.tokens?.output_tokens || 0),
      },
    };
  }

  async testConnection(apiKey: string, model: string): Promise<TestConnectionResult> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
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
          message = parsed.message || parsed.error?.message || message;
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
        message: 'Successfully connected to Cohere',
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

export const cohereProvider = new CohereProvider();
