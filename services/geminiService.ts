
import { GoogleGenAI, Type } from "@google/genai";
import { ExperimentState, AttachmentData, GroundingSource } from "../types";

const DYNAMIC_SIM_SYSTEM_PROMPT = `You are the REVOLT Scientific Simulation Engine. 
    Your mission is to design a high-fidelity 2D laboratory simulation for ANY scientific topic requested.
    
    RESEARCH PROTOCOL:
    1. USE GOOGLE SEARCH to research the specific "experimental setup diagram" and "chemical/physics behavior".
    2. Identify reactive properties: Does it shrink? Does it change color? Does it emit gas? Does it float?
    3. Return a JSON "setup" that EXACTLY matches the real-world science.

    CHEMICAL REACTION MAPPING:
    - If a metal reacts with water (e.g. Sodium): Set buoyancy: 1.0, consumptionRate: 0.05, trailColor: "#ff00ff" (pink for NaOH), gasEvolutionRate: 0.8.
    - If a gas is produced: Set gasEvolutionRate: 0.5.
    - If mass is lost: Set consumptionRate > 0.

    SUPPORTED APPARATUS: beaker, flask, test_tube, pipette, bunsen, magnet, prism, lens_convex, battery, weight, etc.

    JSON STRUCTURE:
    {
      "description": "A safety-focused simulation of [topic]. [Brief Scientific explanation].",
      "setup": {
        "name": "Title",
        "parameters": [{"name": "variable", "value": 1.0}],
        "entities": [
          {"id": "e1", "type": "beaker", "x": 400, "y": 500, "fluidLevel": 0.6, "color": "#ffffff"},
          {"id": "e2", "type": "circle", "label": "Sodium", "x": 400, "y": 440, "radius": 15, "color": "#cccccc", "buoyancy": 1.0, "consumptionRate": 0.02, "trailColor": "#ff00ff"}
        ],
        "physicsRules": [{"type": "chemical_reaction"}, {"type": "gravity"}]
      }
    }

    IMPORTANT: For Sodium and Water, the Sodium MUST be placed exactly at the water's surface (container's y - (height * fluidLevel)).`;

const extractJson = (text: string) => {
  try {
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) return JSON.parse(codeBlockMatch[1]);
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) return JSON.parse(text.substring(firstBrace, lastBrace + 1));
  } catch (e) { console.error("JSON Error", e); }
  return null;
};

// Fixed to use systemInstruction and handle file attachments in content parts
export const getExperimentLogic = async (prompt: string, attachment?: AttachmentData): Promise<{ 
  description: string; 
  setup: Partial<ExperimentState>;
  sources: GroundingSource[];
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: `Task: ${prompt}` }];

  if (attachment) {
    parts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.data,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { 
      tools: [{ googleSearch: {} }],
      systemInstruction: DYNAMIC_SIM_SYSTEM_PROMPT
    }
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || [];
  const data = extractJson(response.text || "");
  
  if (data?.setup) {
    const parameters: any = {};
    data.setup.parameters?.forEach((p: any) => parameters[p.name] = p.value);
    return { description: data.description, setup: { ...data.setup, parameters }, sources };
  }
  return { description: response.text || "", setup: {}, sources };
};

// Fixed to properly structure parts with optional attachments and use systemInstruction
export const chatWithLabAssistant = async (history: any[], message: string, attachment?: AttachmentData): Promise<{ 
  text: string; 
  sources: GroundingSource[];
  newExperiment?: Partial<ExperimentState>;
  showGraph?: boolean;
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: message }];

  if (attachment) {
    parts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.data,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { 
      tools: [{ googleSearch: {} }],
      systemInstruction: DYNAMIC_SIM_SYSTEM_PROMPT
    }
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || [];
  const text = response.text || "";
  const data = extractJson(text);
  
  let newExperiment;
  if (data?.setup) {
    const params: any = {};
    data.setup.parameters?.forEach((p: any) => params[p.name] = p.value);
    newExperiment = { ...data.setup, parameters: params };
  }

  return {
    text: text.replace(/```json[\s\S]*?```/g, "").replace(/\{[\s\S]*\}/g, "").trim(),
    sources,
    newExperiment,
    showGraph: data?.showGraph || message.toLowerCase().includes('graph')
  };
};
