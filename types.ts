export interface Bridge {
  id: string;
  fieldA: string;
  fieldB: string;
  description: string;
  relevanceScore: number;
  evidence?: string[];
}

export interface TermMapping {
  id: string;
  termA: string;
  termB: string;
  explanation: string;
  fieldA?: string;
  fieldB?: string;
  timestamp?: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  description: string;
  math?: string;
}

export interface AnalysisResult {
  bridges: Bridge[];
  mappings: TermMapping[];
  timeline: TimelineEvent[];
  summary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isDiscovery?: boolean;
  isError?: boolean;
  attachment?: string; // Base64 string for images
}

export interface CatalogEntry {
  filename: string;
  speaker: string;
  title: string;
  fields: string[];
  main_results: string[];
  techniques: string[];
  formalization_score: number;
  one_line_summary: string;
  url: string;
  workshop_code?: string;
  workshop_title?: string;
  year?: number;
  date?: string;
  arxivUrl?: string;
}

export interface LectureMetadata extends CatalogEntry {
  id: string;
  processed?: boolean;
  duration_seconds?: number;
}

export enum ViewMode {
  VIDEO = 'VIDEO',
  CHAT = 'CHAT'
}

export enum AppMode {
  DISCOVERY = 'DISCOVERY',
  ANALYSIS = 'ANALYSIS'
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary?: string; // abstract
  abstract?: string; // Alias for summary often used in API responses
  publishedDate?: string;
  year?: number;
  url?: string;
  arxivId?: string;
  doi?: string;
  citationCount?: number;
  venue?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  EXPLORER = 'EXPLORER',
  ASSISTANT = 'ASSISTANT',
  SETTINGS = 'SETTINGS'
}

export interface DeepGrok {
  executive_summary: string;
  central_question: string;
  intuitive_why: string;
  key_definitions: Array<{ term: string; definition: string; latex?: string }>;
  proof_flow: Array<{ step: number; description: string; insight?: string }>;
  techniques_used: string[];
  implications: string[];
}

export interface Formula {
  id: string;
  latex: string;
  plain_text: string;
  definition: string;
  variables: Record<string, string>;
  first_appearance: number;
}

export interface OutlineSection {
  id: string;
  start_time: number;
  end_time: number;
  title: string;
  summary: string;
  key_concepts: string[];
}

export interface Citation {
  id: string;
  type: 'paper' | 'book' | 'theorem' | 'conjecture';
  title: string;
  authors?: string[];
  year?: number;
  context: string;
  timestamp?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'conceptual' | 'proof' | 'application';
  difficulty: 'easy' | 'medium' | 'hard';
  hint: string;
  answer: string;
}

export interface TranscriptSegment {
  start_time: number;
  end_time: number;
  text: string;
}

export enum AnalysisType {
  DEEP_GROK = 'DEEP_GROK',
  MATH_EXTRACTION = 'MATH_EXTRACTION',
  SMART_OUTLINE = 'SMART_OUTLINE',
  BRIDGE_DETECTION = 'BRIDGE_DETECTION',
  CITATIONS = 'CITATIONS',
  QUIZ = 'QUIZ',
  TRANSCRIPT = 'TRANSCRIPT'
}

export interface WhiteboardCapture {
  id: string;
  timestamp: number;
  image_base64: string;
  ocr_text: string;
  latex_formulas: string[];
}

export interface VideoAnalysis {
  lecture_id: string;
  processed_at: Date;
  transcript: TranscriptSegment[];
  whiteboard_captures: WhiteboardCapture[];
  extracted_formulas: Formula[];
  outline: OutlineSection[];
  deep_grok: DeepGrok;
  bridges: Bridge[];
  term_mappings: TermMapping[];
  citations: Citation[];
  quiz: QuizQuestion[];
}

export interface VideoState {
  url: string;
  file?: File;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}