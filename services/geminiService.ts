
import { GoogleGenAI } from "@google/genai";

// FIX: Initialize with API key directly from environment variables and remove manual checks, per coding guidelines.
// Assume process.env.API_KEY is configured in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-3-flash-preview';

export const getSimpleChatResponse = async (prompt: string): Promise<string> => {
  // FIX: Removed explicit API_KEY check. The SDK will handle errors for missing/invalid keys.
  try {
    const systemInstruction = `You are an expert farm management assistant for a livestock farm named 'مزرعة الأمل'. 
    Your language is Arabic. Provide concise, helpful, and professional advice. 
    Do not use markdown formatting.`;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    const text = response.text;
    
    if (text) {
      return text;
    } else {
      return "لم أتمكن من إيجاد إجابة. يرجى المحاولة مرة أخرى.";
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى لاحقاً.";
  }
};
