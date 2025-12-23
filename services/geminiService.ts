
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ExperimentState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'AIzaSyDmN3Je260sagFmNWkt-6c-iqeNZRDgKUc' });

export const getExperimentLogic = async (prompt: string): Promise<{ 
  description: string; 
  setup: Partial<ExperimentState>;
  sources?: { title: string; uri: string }[];
}> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Plan a virtual lab experiment for: ${prompt}. 
    Define the physical or chemical parameters, apparatus needed, and the mathematical model (how variables change over time).
    Return a detailed scientific description and a structured setup configuration.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          setup: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['physics', 'chemistry'] },
              parameters: {
                type: Type.OBJECT,
                additionalProperties: { type: Type.NUMBER }
              },
              apparatus: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['name', 'type', 'parameters', 'apparatus']
          }
        },
        required: ['description', 'setup']
      }
    }
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any) => web) || [];

  try {
    const data = JSON.parse(response.text);
    return { ...data, sources };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return {
      description: response.text,
      setup: { name: 'Experiment', type: 'physics', parameters: {}, apparatus: [] },
      sources
    };
  }
};

export const chatWithLabAssistant = async (history: { role: string; parts: { text: string }[] }[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are an expert Physics and Chemistry Lab Assistant for Revolt Lab. Help users understand the science behind their experiments. Be concise and accurate.',
    },
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};
