import { DuckDuckGoAIService } from '../src/DuckDuckGoAIService';
import { generateText, streamText } from 'ai';

describe('DuckDuckGoAIService - text', () => {
  
  it('deve retornar uma resposta real do DuckDuckGo quando prompt text', async () => {
    const { text: result } = await generateText({
      model: new DuckDuckGoAIService(),
      prompt: 'Qual é a capital da Suécia?',
    });
    console.log('Resposta do DuckDuckGo:', result);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    const lowerResult = result.toLowerCase();
    expect(lowerResult).toMatch(/estocolmo|stockholm/);
  }, 8000);

  it('deve retornar uma resposta real do DuckDuckGo quando prompt array', async () => {
    const { text: result } = await generateText({
      model: new DuckDuckGoAIService(),
      messages: [
        { role: 'system', content: 'de respostas concisas' },
        { role: 'user', content: 'Qual é a capital da Suécia?' },
        { role: 'assistant', content: 'estocolmo' },
        { role: 'user', content: 'E qual é a capital da França?' },
      ],
    });
    console.log('Resposta do DuckDuckGo:', result);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    const lowerResult = result.toLowerCase();
    expect(lowerResult).toMatch(/paris/);
  }, 8000);
});

describe('DuckDuckGoAIService - stream', () => {
  it('deve retornar uma resposta real do DuckDuckGo quando prompt text', async () => {

    const { textStream } = streamText({
      model: new DuckDuckGoAIService(),
      prompt: 'Qual é a capital da França?',    
    });
    let result = '';
    for await (const textPart of textStream) {
      result += textPart;
    }
    console.log('Resposta do DuckDuckGo:', result);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    const lowerResult = result.toLowerCase();
    expect(lowerResult).toMatch(/paris/);
  }, 8000);

  it('deve retornar uma resposta real do DuckDuckGo quando prompt array', async () => {
    const { textStream } = streamText({
      model: new DuckDuckGoAIService(),
      messages: [
        { role: 'system', content: 'de respostas concisas' },
        { role: 'user', content: 'Qual é a capital da Suécia?' },
        { role: 'assistant', content: 'estocolmo' },
        { role: 'user', content: 'E qual é a capital da França?' },
      ],   
    });
    let result = '';
    for await (const textPart of textStream) {
      result += textPart;
    }
    console.log('Resposta do DuckDuckGo:', result);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    const lowerResult = result.toLowerCase();
    expect(lowerResult).toMatch(/paris/);
  }, 8000);
});