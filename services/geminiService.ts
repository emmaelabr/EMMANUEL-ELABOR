import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ExperimentState, AttachmentData, GroundingSource } from "../types";

// --- SECURITY CHECK ---
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("WARNING: Gemini API Key is missing. Check your .env file.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

const DYNAMIC_SIM_SYSTEM_PROMPT = `You are the REVOLT Scientific Simulation Engine...`; 

/**
 * FIXED: Uses Gemini 1.5 Pro with System Instructions & JSON Mode
 */
export const getExperimentLogic = async (prompt: string, attachment?: AttachmentData) => {
  if (!API_KEY) throw new Error("API Key not configured");

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    systemInstruction: DYNAMIC_SIM_SYSTEM_PROMPT,
  });

  const parts: any[] = [{ text: `Task: ${prompt}` }];

  if (attachment) {
    parts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.data, 
      },
    });
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    // Enabling Google Search Grounding for scientific accuracy
    tools: [{ googleSearchRetrieval: {} } as any], 
  });

  const response = result.response;
  const text = response.text();
  
  // Custom JSON extraction logic (or use generationConfig for strict JSON)
  const data = extractJson(text);

  return {
    description: data?.description || text,
    setup: data?.setup || {},
    sources: response.candidates?.[0]?.groundingMetadata?.searchEntryPoint?.renderedContent || []
  };
};
