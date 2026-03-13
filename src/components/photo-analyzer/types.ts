export type PhotoFile = {
  file: File;
  preview: string;
  id: string;
};

export type ImageFeedback = {
  index: number;
  role: string;
  quality: string;
  note: string | null;
};

export type AnalysisResult = {
  likely_issue?: string;
  urgency_score?: number;
  required_tools?: string[];
  estimated_parts?: string[];
  image_feedback?: ImageFeedback[];
  token_usage_estimate?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export const TRADE_CATEGORIES = [
  { value: "", label: "Auto-detect (optional)" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "structural", label: "Structural" },
  { value: "damp", label: "Damp" },
  { value: "roofing", label: "Roofing" },
  { value: "general", label: "General" },
] as const;

export const MAX_PHOTOS = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
