
import { GoogleGenAI, Type } from "@google/genai";
import { ExperimentState } from "../types";

export const getExperimentLogic = async (prompt: string): Promise<{ 
  description: string; 
  setup: Partial<ExperimentState>;
  sources?: { title: string; uri: string }[];
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
                type: Type.ARRAY,
                description: "List of numeric parameters for the experiment.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of the parameter (e.g., 'mass', 'gravity', 'molarity')" },
                    value: { type: Type.NUMBER, description: "Default numeric value" }
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
      description: response.text || "Calibration failed. Please try a different approach.",
      setup: { name: 'Experiment', type: 'physics', parameters: {}, apparatus: [] },
      sources
    };
  }
};

export const chatWithLabAssistant = async (history: { role: string; parts: { text: string }[] }[], message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are an expert Physics and Chemistry Lab Assistant for Revolt Lab. Help users understand the science behind their experiments. Be concise and accurate.',
    },
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};
