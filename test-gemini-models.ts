// test-gemini-models.js - Test which models are available
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function listAvailableModels() {
  try {
    console.log('🔍 Fetching available Gemini models...\n');

    const result = await (genAI as any).listModels();

    const models = result.models || result;

    console.log('✅ Available models:\n');
    models.forEach((model: any, index: number) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(
        `   Supports: ${model.supportedGenerationMethods.join(', ')}`,
      );
      console.log('');
    });

    // Test models that should work
    const modelsToTest = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-pro',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-flash-latest',
    ];

    console.log('🧪 Testing which models work for streaming:\n');

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        console.log(`✅ ${modelName} - WORKS`);
      } catch (error) {
        console.log(`❌ ${modelName} - FAILS`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

listAvailableModels();
