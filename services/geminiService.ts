
import { GoogleGenAI, Type } from "@google/genai";
import { ExperimentState, ImageData, GroundingSource } from "../types";

export const getExperimentLogic = async (prompt: string, image?: ImageData): Promise<{ 
  description: string; 
  setup: Partial<ExperimentState>;
  sources: GroundingSource[];
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [{ text: `Plan a precise 2D scientific simulation for: ${prompt}. 
    CRITICAL INSTRUCTIONS: 
    - If the user asks for motion in fluids (e.g., falling in water, pendulum in oil), use accurate viscosity (Pa·s) and density (kg/m³) parameters.
    - For "falling_objects", specify "mass1", "mass2", "gravity", "density" of the medium, and "viscosity".
    - For "physics" (pendulum), specify "length", "gravity", and "viscosity" of the medium.
    - If it involves chemical mixing, use "chemistry" with "ph", "temperature", and "reactivity".
    - If light/optics, use "physics" and describe rays.
    
    Render style: Scientific textbook diagram.
    Return a scientific analysis and a structured JSON setup.` }];

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
              type: { type: Type.STRING, enum: ['physics', 'chemistry', 'electronics', 'falling_objects'] },
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

  const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any): web is GroundingSource => !!web) || [];

  try {
    const rawData = JSON.parse(response.text || '{}');
    const parameters: Record<string, number> = {};
    if (Array.isArray(rawData.setup?.parameters)) {
      rawData.setup.parameters.forEach((p: { name: string; value: number }) => {
        parameters[p.name] = p.value;
      });
    }

    return { 
      description: rawData.description || "Calibration complete.",
      setup: {
        ...rawData.setup,
        parameters
      },
      sources 
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return {
      description: response.text || "Neural calibration failed.",
      setup: { name: 'Simulation', type: 'physics', parameters: {}, apparatus: [] },
      sources
    };
  }
};

export const chatWithLabAssistant = async (history: any[], message: string, image?: ImageData): Promise<{ text: string; sources: GroundingSource[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const contents: any = { parts: [{ text: message || "Analyze data." }] };
  if (image) { contents.parts.push({ inlineData: { data: image.data, mimeType: image.mimeType } }); }

  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: 'Your name is Bart. expert Lab Assistant. Use professional, minimal language. Analyze images and prompts as scientific evidence. Refer to laws of physics like Snell\'s law, Newton\'s laws, and Stokes\' law when appropriate.',
    },
  });

  const sources: GroundingSource[] = result.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any): web is GroundingSource => !!web) || [];

  return {
    text: result.text || "Communication timeout.",
    sources
  };
};
