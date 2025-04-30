# DuckDuckGo AI Provider

Um provedor para o [Vercel AI SDK](https://sdk.vercel.ai/) que permite integrar facilmente o modelo de IA do DuckDuckGo em suas aplicações JavaScript/TypeScript.

[![License](https://img.shields.io/github/license/lucasliet/duckduckgo-ai-provider?logo=gitbook&labelColor=%23262c31&color=red&logoColor=white)](LICENSE)
[![JSR @lucasliet](https://jsr.io/badges/@lucasliet)](https://jsr.io/@lucasliet)
[![tests](https://github.com/lucasliet/duckduckgo-ai-provider/actions/workflows/tests.yml/badge.svg)](https://github.com/lucasliet/duckduckgo-ai-provider/actions/workflows/tests.yml)
[![publish](https://github.com/lucasliet/duckduckgo-ai-provider/actions/workflows/publish.yml/badge.svg)](https://github.com/lucasliet/duckduckgo-ai-provider/actions/workflows/publish.yml)
[![JSR Version](https://img.shields.io/jsr/v/%40lucasliet/duckduckgo-ai-provider)](https://jsr.io/@lucasliet/duckduckgo-ai-provider)
[![NPM](https://img.shields.io/npm/v/duckduckgo-ai-provider)](https://www.npmjs.com/package/duckduckgo-ai-provider)

## Características

- Compatível com o Vercel AI SDK (implementa `LanguageModelV1`)
- Suporta chat e geração de texto via DuckDuckGo
- Suporte para ESM, CommonJS, UMD e Deno
- Streaming de respostas em tempo real
- Mínima dependência externa

## Instalação

### npm/Node.js

```bash
npm install duckduckgo-ai-provider
```

### Deno (via JSR)

```typescript
import { DuckDuckGoAIService } from "jsr:@lucasliet/duckduckgo-ai-provider";
```

## Uso Básico

```typescript
import { DuckDuckGoAIService } from "duckduckgo-ai-provider";
import { generateText } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const { text } = await generateText({
    model: new DuckDuckGoAIService(),
    messages,
  });
  
  return text;
}
```

### Uso Direto (sem Vercel AI SDK)

```typescript
import { DuckDuckGoAIService } from "duckduckgo-ai-provider";

// Uso síncrono
async function askQuestion() {
  const ddg = new DuckDuckGoAIService();
  const response = await ddg.chat([
    { role: "user", content: "Qual é a capital da Suécia?" }
  ]);
  console.log(response); // "A capital da Suécia é Estocolmo."
}

// Uso com reader
async function askQuestionWithReader() {
  const ddg = new DuckDuckGoAIService();
  const reader = await ddg.chatReader([
    { role: "user", content: "Explique brevemente o que é inteligência artificial." }
  ]);
  
  // Ler resposta em partes
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(decoder.decode(value));
  }
}

// Uso com streaming
async function askQuestionWithStreaming() {
  const ddg = new DuckDuckGoAIService();
  const stream = await ddg.chatStream([
    { role: "user", content: "Explique brevemente o que é inteligência artificial." }
  ]);
  
  for await (const chunk of stream) {
    console.log(chunk);
  }
}
```

## Opções Avançadas

### Modelos

O DuckDuckGo tem diferentes modelos disponíveis. Por padrão, usamos o "o3-mini":

```typescript
// Use o modelo o3-mini (padrão)
const model = new DuckDuckGoAIService();

// Ou especifique outro modelo
const model = new DuckDuckGoAIService("gpt-4o-mini");
```

## Compatibilidade

Este pacote funciona em:

- Node.js (ESM e CommonJS)
- Navegadores (ESM e UMD)
- Deno (via JSR)
- Bun
- Ambientes edge (Vercel Edge Runtime, Cloudflare Workers, etc.)
