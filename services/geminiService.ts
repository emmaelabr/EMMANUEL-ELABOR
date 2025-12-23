
import { GoogleGenAI, Type } from "@google/genai";
import { ExperimentState, ImageData } from "../types";

export const getExperimentLogic = async (prompt: string, image?: ImageData): Promise<{ 
  description: string; 
  setup: Partial<ExperimentState>;
  sources?: { title: string; uri: string }[];
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [{ text: `Plan an ultra-realistic 2D physics or chemistry simulation for: ${prompt}. 
    Perform deep research to find the exact chemical reactions, physical constants, and apparatus behavior.
    If chemistry: specify color changes, PH levels, and reactivity speeds.
    If electronics: specify voltage, resistance, and bulb intensity models.
    Return a scientific description and a structured setup configuration.
    If an image is provided, integrate its visual setup directly into the experiment logic.` }];

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
  
  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: 'Your name is Bart. You are an expert Lab Assistant. Use Deep Research (Google Search) to provide precise, data-driven analysis of user queries. If the user mentions current experimental data or simulations, analyze the scientific implications. Keep responses professional, authoritative, and helpful.',
    },
  });

  return result.text;
};
