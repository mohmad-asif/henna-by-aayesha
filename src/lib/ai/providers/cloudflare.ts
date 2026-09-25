import {
  AIProvider,
  GenerateTextParams,
  GenerateTextResult,
  TestConnectionResult,
} from '../types';

export class CloudflareProvider implements AIProvider {
  readonly providerKey = 'cloudflare' as const;
  readonly displayName = 'Cloudflare Workers AI';
  readonly defaultModel = '@cf/meta/llama-3.1-8b-instruct';
  readonly supportedModels = [
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/meta/llama-3.3-70b-instruct',
    '@cf/meta/llama-3-8b-instruct',
    '@cf/mistral/mistral-7b-instruct-v0.1',
    '@cf/qwen/qwen1.5-7b-chat-awq',
  ];

  public parseCredentials(
    apiKey: string,
    explicitAccountId?: string
  ): { accountId: string; apiToken: string } {
    let accountId = explicitAccountId?.trim() || '';
    let apiToken = apiKey.trim();

    // Allows format: JSON {"accountId":"...","apiToken":"..."}
    if (apiToken.startsWith('{')) {
      try {
        const obj = JSON.parse(apiToken);
        accountId = accountId || obj.accountId || '';
        apiToken = obj.apiToken || '';
      } catch {
        // continue
      }
    } else if (apiToken.includes(':') && !apiToken.startsWith('Bearer ')) {
      // Allows format: accountId:apiToken
      const [acc, ...rest] = apiToken.split(':');
      accountId = accountId || acc.trim();
      apiToken = rest.join(':').trim();
    }

    // Check optional fallback env var if not yet set
    if (!accountId && process.env.CLOUDFLARE_ACCOUNT_ID) {
      accountId = process.env.CLOUDFLARE_ACCOUNT_ID.trim();
    }

    return {
      accountId: accountId.trim(),
      apiToken: apiToken.trim(),
    };
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    const {
      messages,
      systemPrompt,
      model,
      apiKey,
      accountId: explicitAccountId,
      temperature = 0.7,
      maxTokens = 800,
      signal,
    } = params;

    const { accountId, apiToken } = this.parseCredentials(apiKey, explicitAccountId);

    if (!accountId) {
      throw new Error(
        'Cloudflare Workers AI requires Account ID. Please configure Cloudflare Account ID in Admin Settings.'
      );
    }

    if (!apiToken) {
      throw new Error(
        'Cloudflare Workers AI requires API Token. Please configure Cloudflare API Token in Admin Settings.'
      );
    }

    const formattedMessages: { role: string; content: string }[] = [];

    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        formattedMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const targetModel = model || this.defaultModel;
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${targetModel}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        messages: formattedMessages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Cloudflare AI error (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.errors?.[0]?.message || errorMsg;
      } catch {
        // use default
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    let text = data.result?.response;
    if (!text && Array.isArray(data.result) && data.result[0]?.response) {
      text = data.result[0].response;
    }
    if (!text && data.result?.choices?.[0]?.message?.content) {
      text = data.result.choices[0].message.content;
    }
    if (!text && typeof data.response === 'string') {
      text = data.response;
    }

    if (!text) {
      throw new Error('Cloudflare AI returned an empty response.');
    }

    return {
      text,
      providerKey: this.providerKey,
      model: targetModel,
    };
  }

  async testConnection(
    apiKey: string,
    model: string,
    explicitAccountId?: string
  ): Promise<TestConnectionResult> {
    const startTime = Date.now();
    try {
      const { accountId, apiToken } = this.parseCredentials(apiKey, explicitAccountId);

      if (!accountId) {
        return {
          success: false,
          latencyMs: 0,
          error: 'Cloudflare Account ID is required. Please enter a valid Account ID.',
        };
      }

      if (!apiToken) {
        return {
          success: false,
          latencyMs: 0,
          error: 'Cloudflare API Token is required. Please enter your API Token.',
        };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const targetModel = model || this.defaultModel;
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${targetModel}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Say hello in 5 words or less' }],
          max_tokens: 15,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text();
        let message = `Cloudflare HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(errText);
          message = parsed.errors?.[0]?.message || message;
        } catch {
          // ignore
        }

        if (res.status === 401) {
          message = 'Invalid Cloudflare API Token or unauthorized (HTTP 401).';
        } else if (res.status === 403) {
          message = 'Cloudflare authorization forbidden (HTTP 403). Ensure token has "Workers AI: Read" and "Workers AI: Edit" permissions.';
        } else if (res.status === 404) {
          message = `Cloudflare Account ID or model not found (HTTP 404). Verify Account ID and model name.`;
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
        message: `Successfully connected to Cloudflare Workers AI (${targetModel})`,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
      return {
        success: false,
        latencyMs,
        error: errorMsg.includes('abort') ? 'Cloudflare connection timed out after 15 seconds' : errorMsg,
      };
    }
  }
}

export const cloudflareProvider = new CloudflareProvider();

