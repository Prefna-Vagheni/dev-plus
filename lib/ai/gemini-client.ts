// lib/ai/gemini-client.ts - Fixed Gemini API Client
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Use a stable canonical name instead of the "-latest" alias
const DEFAULT_MODEL = 'gemini-2.5-flash';

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface StreamChunk {
  type: 'text' | 'done';
  content: string;
}

export class GeminiClient {
  /**
   * Generate completion with Gemini
   */
  static async complete(
    messages: Message[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    },
  ): Promise<string> {
    try {
      // Use correct model name: gemini-1.5-flash-latest or gemini-pro
      const model = genAI.getGenerativeModel({
        model: options?.model || DEFAULT_MODEL,
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 4096,
          temperature: options?.temperature || 0.7,
        },
        systemInstruction: options?.systemPrompt,
      });

      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const lastMessage = messages[messages.length - 1].content;
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage);
      const response = await result.response;

      return response.text();
    } catch (error) {
      console.error('[AI] Error generating completion:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate streaming completion
   */
  static async *stream(
    messages: Message[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    },
  ): AsyncGenerator<StreamChunk> {
    try {
      // Use correct model name
      const model = genAI.getGenerativeModel({
        model: options?.model || DEFAULT_MODEL,
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 4096,
          temperature: options?.temperature || 0.7,
        },
        systemInstruction: options?.systemPrompt,
      });

      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const lastMessage = messages[messages.length - 1].content;
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(lastMessage);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield {
            type: 'text',
            content: text,
          };
        }
      }

      yield {
        type: 'done',
        content: '',
      };
    } catch (error) {
      console.error('[AI] Error streaming completion:', error);
      throw new Error('Failed to stream AI response');
    }
  }

  /**
   * Count tokens in text (approximate)
   */
  static estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate text to fit token limit
   */
  static truncateToTokens(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(text);

    if (estimatedTokens <= maxTokens) {
      return text;
    }

    const targetLength = maxTokens * 4;
    return text.slice(0, targetLength) + '...';
  }

  /**
   * Count actual tokens using Gemini's tokenizer
   */
  static async countTokens(
    text: string,
    model: string = DEFAULT_MODEL,
  ): Promise<number> {
    try {
      const geminiModel = genAI.getGenerativeModel({ model });
      const result = await geminiModel.countTokens(text);
      return result.totalTokens;
    } catch (error) {
      console.error('[AI] Error counting tokens:', error);
      return this.estimateTokens(text);
    }
  }

  /**
   * List available models
   */
  static async listModels(): Promise<string[]> {
    try {
      const models = await genAI.listModels();
      return models.map((m) => m.name);
    } catch (error) {
      console.error('[AI] Error listing models:', error);
      return [];
    }
  }
}
