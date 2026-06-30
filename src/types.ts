export type UsernameStatus = "unknown" | "available" | "taken" | "invalid" | "reserved";

export interface ScoreBreakdown {
  lengthScore: number;
  dictionaryScore: number;
  purityScore: number;
  brandabilityScore: number;
  pronounceabilityScore: number;
  popularityScore: number;
}

export interface UsernameRow {
  id: number;
  text: string;
  length: number;
  category: string;
  source: string;
  status: UsernameStatus;
  totalScore: number;
  notes: string;
  favorite: boolean;
  createdAt: string;
  lastCheckedAt: string | null;
  score: ScoreBreakdown;
  invalidReason?: string;
}

export interface GenerateRequest {
  seeds: string[];
  categories: string[];
  limit: number;
}
