import {
  AIProvider,
  GenerateTextParams,
  GenerateTextResult,
  TestConnectionResult,
} from '../types';

export class MistralProvider implements AIProvider {
  readonly providerKey = 'mistral' as const;
  readonly displayName = 'Mistral AI';
  readonly defaultModel = 'mistral-small-latest';
  readonly supportedModels = [
    'mistral-small-latest',
    'mistral-large-latest',
    'open-mistral-7b',
    'codestral-latest',
  ];

  private sanitizeModel(model?: string): string {
    const raw = (model || '').trim();
    if (!raw || raw === 'mistral-medium-latest') {
      return this.defaultModel;
    }
    return raw;
  }

  private parseError(status: number, errText: string, model: string): string {
    let parsedMessage = '';
    try {
      const parsed = JSON.parse(errText);
      if (typeof parsed.message === 'string') {
        parsedMessage = parsed.message;
      } else if (typeof parsed.error?.message === 'string') {
        parsedMessage = parsed.error.message;
      } else if (Array.isArray(parsed.detail)) {
        parsedMessage = parsed.detail
          .map((d: { msg?: string }) => d.msg || JSON.stringify(d))
          .join('; ');
      } else if (typeof parsed.detail === 'string') {
        parsedMessage = parsed.detail;
      }
    } catch {
      // not JSON
    }

    const detailMsg = parsedMessage ? `: ${parsedMessage}` : '';

    if (status === 401) {
      return `Invalid Mistral API key or unauthorized (HTTP 401)${detailMsg}`;
    }
    if (status === 402) {
      return `Mistral billing or payment method required (HTTP 402)${detailMsg}`;
    }
    if (status === 429) {
      return `Mistral rate limit or usage quota exceeded (HTTP 429)${detailMsg}`;
    }
    if (status === 404) {
      return `Mistral model (${model}) or endpoint not found (HTTP 404)${detailMsg}`;
    }

    return `Mistral API error (HTTP ${status})${detailMsg}`;
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

    const activeModel = this.sanitizeModel(model);
    const candidateModels = [activeModel];
    if (activeModel !== 'open-mistral-7b') {
      candidateModels.push('open-mistral-7b');
    }

    const endpoint = 'https://api.mistral.ai/v1/chat/completions';
    let lastError: Error | null = null;

    for (const currentModel of candidateModels) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: currentModel,
            messages: formattedMessages,
            temperature,
            max_tokens: maxTokens,
          }),
          signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          const parsed = this.parseError(res.status, errText, currentModel);

          // If rate limited or unavailable, try fallback model if available
          if ((res.status === 429 || res.status === 403 || res.status === 404) && currentModel !== 'open-mistral-7b') {
            console.warn(`[MistralProvider] ${currentModel} returned HTTP ${res.status}. Falling back to open-mistral-7b...`);
            continue;
          }

          throw new Error(parsed);
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text) {
          throw new Error('Mistral returned an empty response choice.');
        }

        return {
          text,
          providerKey: this.providerKey,
          model: currentModel,
          usage: {
            promptTokens: data.usage?.prompt_tokens,
            completionTokens: data.usage?.completion_tokens,
            totalTokens: data.usage?.total_tokens,
          },
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (signal?.aborted) break;
      }
    }

    throw lastError || new Error('Mistral text generation failed.');
  }

  async testConnection(apiKey: string, model: string): Promise<TestConnectionResult> {
    const startTime = Date.now();
    const activeModel = this.sanitizeModel(model);
    const candidateModels = [activeModel];
    if (activeModel !== 'open-mistral-7b') {
      candidateModels.push('open-mistral-7b');
    }

    const endpoint = 'https://api.mistral.ai/v1/chat/completions';
    let lastError = '';
    let successfulModel = '';
    let replyText = '';

    for (const currentModel of candidateModels) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
              {
                role: 'user',
                content: 'Reply with exactly: Mistral connection successful',
              },
            ],
            max_tokens: 20,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          replyText = data.choices?.[0]?.message?.content?.trim() || '';
          successfulModel = currentModel;
          break;
        }

        const errText = await res.text();
        lastError = this.parseError(res.status, errText, currentModel);

        // If the API key is completely invalid (401), stop immediately without trying fallback
        if (res.status === 401) {
          break;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          lastError = 'Mistral connection timed out after 12 seconds.';
        } else {
          lastError = err instanceof Error ? err.message : 'Unknown connection error';
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    if (!successfulModel) {
      return {
        success: false,
        latencyMs,
        error: lastError || 'Mistral connection failed.',
      };
    }

    const fallbackNote = successfulModel !== activeModel ? ` (fallback to ${successfulModel})` : '';
    return {
      success: true,
      latencyMs,
      message: `Successfully connected to Mistral AI (${successfulModel}${fallbackNote})${replyText ? `: "${replyText}"` : ''}`,
    };
  }
}

export const mistralProvider = new MistralProvider();
