
import { GoogleGenAI, Type, Schema, createUserContent, createPartFromUri } from "@google/genai";
import {
  DeepGrok,
  Formula,
  OutlineSection,
  Bridge,
  TermMapping,
  Citation,
  QuizQuestion,
  TranscriptSegment,
  ChatMessage,
  AnalysisType,
  AnalysisResult,
  TimelineEvent,
  CatalogEntry
} from "../types";

// Models
// Using Gemini 3 Pro for all tasks as requested
const FLASH_MODEL = 'gemini-3-pro-preview';
const PRO_MODEL = 'gemini-3-pro-preview'; 

// --- Helper Functions ---

/**
 * Converts a File object to a Base64 string for inline data transmission.
 */
const fileToPart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:video/mp4;base64,")
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extracts JSON from a potentially markdown-wrapped response.
 */
function extractJSON(text: string): string {
  try {
    let cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
    
    const firstOpenBrace = cleanText.indexOf('{');
    const firstOpenBracket = cleanText.indexOf('[');

    if (firstOpenBracket !== -1 && (firstOpenBrace === -1 || firstOpenBracket < firstOpenBrace)) {
      const lastCloseBracket = cleanText.lastIndexOf(']');
      if (lastCloseBracket !== -1) {
        return cleanText.substring(firstOpenBracket, lastCloseBracket + 1);
      }
    }

    if (firstOpenBrace !== -1) {
      const lastCloseBrace = cleanText.lastIndexOf('}');
      if (lastCloseBrace !== -1) {
        return cleanText.substring(firstOpenBrace, lastCloseBrace + 1);
      }
    }

    return cleanText;
  } catch (e) {
    return text;
  }
}

// --- File Upload API Helpers ---

interface UploadedFile {
  uri: string;
  name: string;
  mimeType: string;
}

const uploadFileToGemini = async (file: File): Promise<UploadedFile> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const mimeType = file.type || 'video/mp4';

  console.log('Uploading file:', file.name, 'size:', file.size, 'type:', mimeType);

  // Use SDK's built-in file upload
  const uploadResult = await ai.files.upload({
    file: file,
    config: { mimeType: mimeType }
  });

  console.log('Upload result:', uploadResult);

  // Poll until file is ACTIVE (required for video files)
  let fileState = uploadResult.state;
  while (fileState === 'PROCESSING') {
    console.log('File processing, waiting...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const fileInfo = await ai.files.get({ name: uploadResult.name });
    fileState = fileInfo.state;
    console.log('File state:', fileState);
  }

  if (fileState !== 'ACTIVE') {
    throw new Error(`File processing failed. State: ${fileState}`);
  }

  return {
    uri: uploadResult.uri,
    name: uploadResult.name,
    mimeType: mimeType
  };
};

// --- Main Service Functions ---

export const analyzeVideoFile = async (file: File): Promise<AnalysisResult> => {
  const uploaded = await uploadFileToGemini(file);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze this mathematics lecture video deeply.
    Generate a structured analysis including:
    1. Executive summary
    2. Key cross-domain bridges (connections between different math fields)
    3. Detailed timeline of topics
    4. Term mappings (definitions and connections)
    
    Output MUST be valid JSON matching this structure:
    {
      "summary": "...",
      "bridges": [{ "id": "b1", "fieldA": "...", "fieldB": "...", "description": "...", "relevanceScore": 0.9 }],
      "mappings": [{ "id": "m1", "termA": "...", "termB": "...", "explanation": "..." }],
      "timeline": [{ "id": "t1", "timestamp": "00:00", "description": "..." }]
    }
  `;

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { fileData: { fileUri: uploaded.uri, mimeType: uploaded.mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    }
  });

  const text = response.text || "{}";
  const jsonStr = extractJSON(text);
  return JSON.parse(jsonStr);
};

export const generateTranscript = async (file: File): Promise<TranscriptSegment[]> => {
  const uploaded = await uploadFileToGemini(file);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Generate a timestamped transcript for this video.
    Return a JSON array of segments:
    [
      { "start_time": 0, "end_time": 10, "text": "..." },
      ...
    ]
  `;

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { fileData: { fileUri: uploaded.uri, mimeType: uploaded.mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = response.text || "[]";
  const jsonStr = extractJSON(text);
  return JSON.parse(jsonStr);
};

export const generateMathResponse = async (prompt: string, history: string[] = []): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Convert simplified history strings to Content objects if needed, 
  // but for single turn or simple context injection, standard generation is fine.
  // Here we assume history is just context strings for the system prompt or accumulated context.
  
  const systemContext = `You are an expert research mathematician assistant named MathBridge.
  You help users understand complex math lectures.
  Use LaTeX for math formulas (e.g., $x^2$, $$ \int f(x) dx $$).
  Be precise, insightful, and helpful.
  Previous conversation context:
  ${history.join('\n')}
  `;

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ text: systemContext + "\n\n" + prompt }]
      }
    ]
  });

  return response.text || "I apologize, I couldn't generate a response.";
};

export const chatWithFrame = async (base64Image: string, history: ChatMessage[], prompt: string, timestamp: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1],
      mimeType: "image/png"
    }
  };

  const context = `
    The user is asking about a specific frame from a lecture video at timestamp ${timestamp}.
    Analyze the blackboard/slide content carefully.
    Identify any theorems, formulas, or diagrams.
  `;

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          imagePart,
          { text: context + "\n\n" + prompt }
        ]
      }
    ]
  });

  return response.text || "I couldn't analyze the frame.";
};

export const getDeepDiveAnalysis = async (bridge: Bridge): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Provide a deep dive analysis of the connection between ${bridge.fieldA} and ${bridge.fieldB}.
    Context: ${bridge.description}
    
    Explain the mathematical intuition, key theorems linking them, and historical context.
    Use LaTeX for math. Keep it rigorous but accessible to a grad student.
  `;

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  return response.text || "Analysis unavailable.";
};

// Placeholder for catalog analysis if needed, currently unused in upload flow
export const analyzeLecture = async (lectureUrl: string): Promise<AnalysisResult> => {
  throw new Error("Direct URL analysis not implemented. Please upload a video file.");
};
