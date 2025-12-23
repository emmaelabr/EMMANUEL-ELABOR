
import { GoogleGenAI, Type } from "@google/genai";
import { ExperimentState, ImageData } from "../types";

export const getExperimentLogic = async (prompt: string, image?: ImageData): Promise<{ 
  description: string; 
  setup: Partial<ExperimentState>;
  sources?: { title: string; uri: string }[];
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [{ text: `Plan a virtual lab experiment for: ${prompt}. 
    Define the physical or chemical parameters, apparatus needed, and the mathematical model.
    Return a detailed scientific description for the user and a structured setup configuration.
    If it's an electronics experiment, specify battery, resistor, bulb etc. in apparatus.
    If an image is provided, analyze the visual context to determine the setup.` }];

  if (image) {
    parts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
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
              type: { type: Type.STRING, enum: ['physics', 'chemistry', 'electronics'] },
              parameters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  },
                  required: ["name", "value"]
                }
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
    const rawData = JSON.parse(response.text || '{}');
    const parameters: Record<string, number> = {};
    if (Array.isArray(rawData.setup?.parameters)) {
      rawData.setup.parameters.forEach((p: { name: string; value: number }) => {
        parameters[p.name] = p.value;
      });
    }

    return { 
      description: rawData.description || "Experimental setup generated.",
      setup: {
        ...rawData.setup,
        parameters
      },
      sources 
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return {
      description: response.text || "Calibration failed.",
      setup: { name: 'Experiment', type: 'physics', parameters: {}, apparatus: [] },
      sources
    };
  }
};

export const chatWithLabAssistant = async (history: any[], message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'Your name is Bart. You are an expert Physics and Chemistry Lab Assistant for Revolt Lab. Provide scientific analytics, observations, and data-driven insights. If the user asks for a graph, confirm you are showing it. Keep responses professional and precise.',
    },
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};
