
import { GoogleGenAI, Type } from "@google/genai";
import { ExperimentState, AttachmentData, GroundingSource } from "../types";

const DYNAMIC_SIM_SYSTEM_PROMPT = `You are the REVOLT Scientific Simulation Engine. 
    Your mission is to design a high-fidelity 2D laboratory simulation for ANY scientific topic.
    
    RESEARCH PROTOCOL:
    1. USE GOOGLE SEARCH to find actual "2D experimental setup diagrams", "physics schematics", or "chemistry apparatus layouts" for the user's request.
    2. Analyze the spatial relationships (where the beaker is, where the laser hits, how the particles move).
    3. Translate this visual research into a 2D JSON setup.

    JSON STRUCTURE RULES:
    - description: A concise scientific explanation of what the user is seeing.
    - setup: 
        - name: The specific name of the experiment.
        - type: 'dynamic'
        - parameters: An array of {name, value} for user-controlled variables.
        - entities: Array of {id, type, x, y, radius, width, height, color, label} representing the visual components.
        - physicsRules: Array of {type, strength} (e.g., gravity, brownian, oscillation, reflection).
    
    VISUAL STYLE:
    Schematic, technical, with clear labels. Use a coordinate system where (0,0) is top-left, but the LabScene will center the render.
    
    IMPORTANT: You must return the JSON block clearly. If the user asks for a graph, set "showGraph": true.`;

const extractJson = (text: string) => {
  try {
    // Look for JSON in code blocks first
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }
    // Fallback to finding the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const candidate = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(candidate);
    }
  } catch (e) {
    console.error("Critical JSON Parse Error:", e, "Raw text:", text);
  }
  return null;
};

export const getExperimentLogic = async (prompt: string, attachment?: AttachmentData): Promise<{ 
  description: string; 
  setup: Partial<ExperimentState>;
  sources: GroundingSource[];
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: `${DYNAMIC_SIM_SYSTEM_PROMPT}\n\nTask: ${prompt}` }];

  if (attachment) {
    parts.push({ inlineData: { data: attachment.data, mimeType: attachment.mimeType } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any): web is GroundingSource => !!web) || [];

  const text = response.text || "";
  const data = extractJson(text);

  if (data && data.setup) {
    const parameters: Record<string, number> = {};
    if (Array.isArray(data.setup.parameters)) {
      data.setup.parameters.forEach((p: { name: string; value: number }) => {
        parameters[p.name] = p.value;
      });
    }
    return { 
      description: data.description || text.split('{')[0].trim() || "Simulation Initialized.",
      setup: { ...data.setup, parameters },
      sources 
    };
  }

  // Final fallback if research fails
  return {
    description: text || "System is recalibrating based on search results.",
    setup: { 
      name: 'Dynamic Research', 
      type: 'dynamic', 
      parameters: { status: 1 }, 
      entities: [{ id: 'core', type: 'circle', x: 400, y: 300, radius: 20, label: 'SCANNING...' }], 
      physicsRules: [] 
    },
    sources
  };
};

export const chatWithLabAssistant = async (history: any[], message: string, attachment?: AttachmentData): Promise<{ 
  text: string; 
  sources: GroundingSource[];
  newExperiment?: Partial<ExperimentState>;
  showGraph?: boolean;
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const contents: any = { parts: [{ text: `You are Bart, the Lab Assistant. 
    1. Research the user's query with Google Search.
    2. If they want a NEW experiment or to VISUALIZE something different, generate a new "setup" JSON.
    3. If they want a GRAPH or PLOT, ensure you set "showGraph": true.
    
    Current User Query: ${message}` }] };
    
  if (attachment) { 
    contents.parts.push({ inlineData: { data: attachment.data, mimeType: attachment.mimeType } }); 
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: DYNAMIC_SIM_SYSTEM_PROMPT,
    },
  });

  const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any): web is GroundingSource => !!web) || [];

  const text = response.text || "Synchronizing with research database...";
  const data = extractJson(text);
  
  let newExperiment: Partial<ExperimentState> | undefined;
  let showGraph = message.toLowerCase().includes('graph') || message.toLowerCase().includes('plot') || message.toLowerCase().includes('data');

  if (data && data.setup) {
    const params: Record<string, number> = {};
    if (Array.isArray(data.setup.parameters)) {
      data.setup.parameters.forEach((p: any) => params[p.name] = p.value);
    }
    newExperiment = {
      name: data.setup.name,
      type: data.setup.type,
      parameters: params,
      entities: data.setup.entities,
      physicsRules: data.setup.physicsRules,
      apparatus: data.setup.apparatus
    };
    if (data.showGraph !== undefined) showGraph = !!data.showGraph;
  }

  return {
    text: text.replace(/```json[\s\S]*?```/g, "").replace(/\{[\s\S]*\}/g, "").trim() || "Analysis complete.",
    sources,
    newExperiment,
    showGraph
  };
};
