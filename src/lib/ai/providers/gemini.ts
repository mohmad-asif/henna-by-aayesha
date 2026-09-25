import {
  AIProvider,
  GenerateTextParams,
  GenerateTextResult,
  TestConnectionResult,
} from '../types';

export class GeminiProvider implements AIProvider {
  readonly providerKey = 'gemini' as const;
  readonly displayName = 'Google Gemini';
  readonly defaultModel = 'gemini-3.5-flash';
  readonly supportedModels = [
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
  ];

  private sanitizeModel(model?: string): string {
    const raw = (model || '').trim();
    if (
      !raw ||
      raw === 'gemini-1.5-flash' ||
      raw === 'gemini-2.0-flash' ||
      raw === 'gemini-2.5-flash' ||
      raw === 'gemini-1.5-pro' ||
      raw === 'gemini-3.8-flash'
    ) {
      return this.defaultModel;
    }
    return raw;
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    const { messages, systemPrompt, model, apiKey, temperature = 0.7, maxTokens = 800, signal } = params;

    const rawMapped = messages
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content.trim() }],
      }));

    // Google Gemini API strictly requires that the first content turn is from 'user'
    while (rawMapped.length > 0 && rawMapped[0].role === 'model') {
      rawMapped.shift();
    }

    if (rawMapped.length === 0) {
      rawMapped.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    // Google Gemini API requires strictly alternating roles; collapse adjacent same-role turns
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const turn of rawMapped) {
      const last = contents[contents.length - 1];
      if (last && last.role === turn.role) {
        last.parts.push(...turn.parts);
      } else {
        contents.push({ role: turn.role, parts: [...turn.parts] });
      }
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    if (systemPrompt && systemPrompt.trim()) {
      body.systemInstruction = {
        parts: [{ text: systemPrompt.trim() }],
      };
    }

    const activeModel = this.sanitizeModel(model);
    const candidateModels = [activeModel];
    if (activeModel !== 'gemini-3.5-flash') {
      candidateModels.push('gemini-3.5-flash');
    }

    let lastError: Error | null = null;

    for (const currentModel of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        currentModel
      )}:generateContent`;

      try {
        let res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(body),
          signal,
        });

        // Handle transient 503 demand spikes with a brief 1.2s retry
        if (res.status === 503) {
          await new Promise((r) => setTimeout(r, 1200));
          if (signal?.aborted) throw new Error('Request aborted');
          res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(body),
            signal,
          });
        }

        if (!res.ok) {
          const errText = await res.text();
          let errorMsg = `Gemini API error (HTTP ${res.status})`;
          try {
            const parsed = JSON.parse(errText);
            errorMsg = parsed.error?.message || errorMsg;
          } catch {
            // use default
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts;

        let text = '';
        if (Array.isArray(parts)) {
          text = parts
            .filter((p: { text?: string; thought?: boolean }) => typeof p.text === 'string' && !p.thought)
            .map((p: { text: string }) => p.text)
            .join('')
            .trim();
        }

        if (!text) {
          throw new Error('Gemini returned an empty response candidate.');
        }

        return {
          text,
          providerKey: this.providerKey,
          model: currentModel,
          usage: {
            promptTokens: data.usageMetadata?.promptTokenCount,
            completionTokens: data.usageMetadata?.candidatesTokenCount,
            totalTokens: data.usageMetadata?.totalTokenCount,
          },
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // If aborted, do not try next model
        if (signal?.aborted) break;
      }
    }

    throw lastError || new Error('Gemini text generation failed.');
  }

  async testConnection(apiKey: string, model: string): Promise<TestConnectionResult> {
    const startTime = Date.now();
    try {
      const activeModel = this.sanitizeModel(model);
      const candidateModels = [activeModel];
      if (activeModel !== 'gemini-3.5-flash') {
        candidateModels.push('gemini-3.5-flash');
      }

      let lastError = '';
      let successfulModel = '';

      for (const currentModel of candidateModels) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            currentModel
          )}:generateContent`;

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
              generationConfig: { maxOutputTokens: 20 },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (res.ok) {
            successfulModel = currentModel;
            break;
          }

          const errText = await res.text();
          let message = `HTTP ${res.status}`;
          try {
            const parsed = JSON.parse(errText);
            message = parsed.error?.message || message;
          } catch {
            // ignore
          }
          lastError = message;

          // If the key is completely invalid (HTTP 400 API key not valid), do not try fallback
          if (res.status === 400 && message.toLowerCase().includes('api key not valid')) {
            break;
          }
        } catch (err: unknown) {
          clearTimeout(timeout);
          lastError = err instanceof Error ? err.message : 'Unknown connection error';
        }
      }

      const latencyMs = Date.now() - startTime;

      if (!successfulModel) {
        return {
          success: false,
          latencyMs,
          error: lastError || 'Connection failed.',
        };
      }

      const note = successfulModel !== activeModel ? ` (fallback to ${successfulModel})` : '';
      return {
        success: true,
        latencyMs,
        message: `Successfully connected to Google Gemini (${successfulModel}${note})`,
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

export const geminiProvider = new GeminiProvider();
