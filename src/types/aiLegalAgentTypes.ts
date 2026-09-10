// Multi-Agent State Machine & Fail-Safe Architecture Types for AI Legal Document Studio

export type AgentPhase = 
  | "Conversation"
  | "Requirement"
  | "Structure"
  | "Drafting"
  | "Validation"
  | "Pricing";

export interface AgentPhaseConfig {
  id: AgentPhase;
  name: string;
  nameGu: string;
  nameHi: string;
  description: string;
  icon: string;
  color: string;
}

export interface ValidationErrorItem {
  fieldKey: string;
  labelEn: string;
  labelGu: string;
  labelHi: string;
  missingDetail: string;
  promptQuestionEn: string;
  promptQuestionGu: string;
  promptQuestionHi: string;
}

export interface DocumentVersionSnapshot {
  id: string;
  versionNumber: number;
  label: string;
  timestamp: string;
  isoDate: string;
  content: string;
  wordCount: number;
  calculatedPrice: number;
  author: "AI Agent" | "User Edit" | "Gemini AI" | "Initial Template";
  changesSummary?: string;
}

export interface QueuedOrderPayload {
  queueId: string;
  orderId: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  docType: string;
  content: string;
  wordCount: number;
  totalPrice: number;
  paymentRef: string;
  paymentStatus: string;
  timestamp: string;
  pdfBase64?: string;
  docxBase64?: string;
  retryCount: number;
  lastAttempt?: string;
  status: "pending" | "syncing" | "failed";
}
