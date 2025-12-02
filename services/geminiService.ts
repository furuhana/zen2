import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize strictly if key exists, otherwise handle gracefully in UI
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A short, retro-futuristic or cryptic title for this diary entry (max 5 words).",
    },
    mood: {
      type: Type.STRING,
      description: "A single word describing the emotional tone (e.g., Melancholy, Electric, Static, Void).",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 short keywords related to the content.",
    },
  },
  required: ["title", "mood", "tags"],
};

export const analyzeEntry = async (text: string): Promise<AnalysisResult> => {
  if (!ai) {
    throw new Error("API Key missing");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following diary entry. Provide a title, a mood, and tags. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are an onboard AI for a retro-futuristic spaceship. Your output should feel technical yet poetic.",
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as AnalysisResult;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Fallback if AI fails
    return {
      title: "CORRUPTED_DATA_SEGMENT",
      mood: "UNKNOWN",
      tags: ["ERROR", "OFFLINE"],
    };
  }
};