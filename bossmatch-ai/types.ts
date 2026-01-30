
export interface UserProfile {
  resumeText: string;
  expectations: string;
}

export interface JobMatch {
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  reason: string;
  url: string;
  skillsMatch: string[];
  requirementsMissing: string[];
  jdSummary: string;
}

export interface AnalysisResult {
  keywords: string[];
  summary: string;
  suggestedRoles: string[];
  strengths: string[];
}

export interface OptimizationDiagnosis {
  matchOverview: string;
  score: number;
  coreGaps: string[];
  quickWins: string[];
}

export interface OptimizationStep {
  section: string;
  original: string;
  improved: string;
  reasoning: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  profile: UserProfile;
  analysis: AnalysisResult;
  jobs: JobMatch[];
}
