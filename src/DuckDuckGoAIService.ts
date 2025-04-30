import { LanguageModelV1, LanguageModelV1FinishReason, LanguageModelV1CallWarning, LanguageModelV1StreamPart } from '@ai-sdk/provider';

export class DuckDuckGoAIService implements LanguageModelV1 {

  readonly specificationVersion = 'v1';
  readonly defaultObjectGenerationMode = 'json';
  readonly supportsImageUrls = false;
  readonly supportsStructuredOutputs = false;

  readonly modelId: string;
  private static readonly API_URL = 'https://duckduckgo.com/duckchat/v1';
  private static readonly VQD_SESSION_KEY = 'duckduckgo_vqd';

  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0',
    Accept: 'text/event-stream',
    'Accept-Language': 'pt-BR',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Content-Type': 'application/json',
    Origin: 'https://duckduckgo.com',
  };

  constructor(model: string = 'o3-mini') {
    this.modelId = model;
  }

  get provider(): string {
    return 'duckduckgo';
  }

  /**
   * Converte o prompt do SDK (string ou array de mensagens) para o formato aceito pela API
   */
  private _normalizeMessages(prompt: string | Array<{ role: string; content: any }>): { role: string, content: string }[] {
    if (typeof prompt === 'string') {
      return [{ role: 'user', content: prompt }];
    }
    return (prompt as Array<{ role: string; content: any }>).map(msg => {
      let content = msg.content;
      if (Array.isArray(content)) {
        content = content.map((p: any) => typeof p === 'string' ? p : p.text ?? '').join(' ');
      } else {
        content = String(content);
      }
      return { role: msg.role, content };
    });
  }

  async doGenerate(options: Parameters<LanguageModelV1['doGenerate']>[0]) {
    const messages = this._normalizeMessages(options.prompt);
    const text = await this.chat(messages);
    return {
      text,
      finishReason: 'stop' as LanguageModelV1FinishReason,
      usage: { promptTokens: NaN, completionTokens: NaN },
      rawCall: { rawPrompt: options.prompt, rawSettings: {} },
      rawResponse: {},
      request: {},
      response: {},
      warnings: [] as LanguageModelV1CallWarning[],
    };
  }

  async doStream(options: Parameters<LanguageModelV1['doStream']>[0]) {
    const messages = this._normalizeMessages(options.prompt);
    const reader = await this.chatStream(messages);
    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value, { stream: true }).split('\n');
          for (const line of lines) {
            let delta = line;
            if (delta) controller.enqueue({ type: 'text-delta', textDelta: delta });
          }
        }
        controller.enqueue({ type: 'finish', finishReason: 'stop', usage: { promptTokens: NaN, completionTokens: NaN } });
        controller.close();
      }
    });
    return { stream, rawCall: { rawPrompt: options.prompt, rawSettings: {} }, rawResponse: {}, request: {}, warnings: [] };
  }

  private _changeRolesToUser(messages: { role: string, content: string }[]): { role: string, content: string }[] {
    return messages.map(msg => ({ role: 'user', content: msg.content }));
  }

  async chat(messages: { role: string, content: string }[]): Promise<string> {
    const raw = await this._fetchChatResponse(this._changeRolesToUser(messages));
    const text = await raw.text();
    const lines = text.split('\n');
    return this._mapResponse(lines);
  }

  async chatStream(messages: { role: string, content: string }[]): Promise<ReadableStreamDefaultReader> {
    const response = await this._fetchChatResponse(this._changeRolesToUser(messages));
    const reader = response.body!.getReader();
    return this.streamMapResponse(reader, this._mapResponse);
  }

  async streamMapResponse(reader: ReadableStreamDefaultReader, mapResponse: (lines: string[]) => string): Promise<ReadableStreamDefaultReader> {
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const mappedResponse = mapResponse(decoder.decode(value, { stream: true }).split('\n'));
          controller.enqueue(new TextEncoder().encode(mappedResponse));
        }
        controller.close();
      }
    }).getReader();
  }

  /**
   * Executa a requisição de chat e retorna o corpo completo como texto.
   */
  async _fetchChatResponse(
    messageHistory: Array<{ content: string; role: string }>,
  ): Promise<Response> {
    const vqdHeader = await this._getVqdHeader();
    const response = await fetch(`${DuckDuckGoAIService.API_URL}/chat`, {
      method: 'POST',
      headers: { ...this.headers, 'x-vqd-4': vqdHeader },
      body: JSON.stringify({ messages: messageHistory, model: this.modelId }),
    });
    if (!response.ok) {
      throw new Error(`Falha ao gerar texto: ${response.statusText}`);
    }
    return response;
  }

  private _mapResponse(lines: string[]): string {
    let result = '';

    for (const line of lines) {
      if (line.trim() === 'data: [DONE]') {
        continue;
      }
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.split('data: ')[1]);
          result += parsed?.message || '';
        } catch (error) {
          console.warn('Erro ao analisar linha:', line, error);
          continue;
        }
      }
    }

    return result.replace(/\\n/g, '\n');
  }

  private async _getVqdHeader(): Promise<string> {
    if (typeof sessionStorage !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(DuckDuckGoAIService.VQD_SESSION_KEY);
        if (cached) return cached;
      } catch (e) {

        console.error("Error accessing sessionStorage:", e);
      }
    }

    const response = await fetch(`${DuckDuckGoAIService.API_URL}/status`, {
      method: 'GET',
      headers: {
        ...this.headers,
        'x-vqd-accept': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao verificar status: ${response.statusText}`);
    }

    const vqdHeader = response.headers.get('x-vqd-4');

    if (!vqdHeader) {
      throw new Error('Falha ao obter o header x-vqd-4 do DuckDuckGo');
    }

    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(DuckDuckGoAIService.VQD_SESSION_KEY, vqdHeader);
      } catch (e) {

        console.error("Error accessing sessionStorage:", e);
      }
    }

    return vqdHeader;
  }
}
