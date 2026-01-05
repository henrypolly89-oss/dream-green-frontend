// FIX: Removed self-import of `SocialPlatform` to resolve declaration conflicts.
export enum SocialPlatform {
  X = 'x',
  Instagram = 'instagram',
  Facebook = 'facebook',
  Google = 'google',
  TikTok = 'tiktok',
}

export interface ImprovementSuggestion {
  area: string;
  suggestion: string;
}

export interface HistoricalAnalysis {
  content_evolution: string[];
  engagement_trends: string[];
  key_milestones: string[];
}

export interface StructuredPositiveFeedback {
  common_themes: string[];
  what_customers_love: string[];
}

export interface StructuredNegativeFeedback {
  common_themes: string[];
  key_areas_of_dissatisfaction: string[];
}

export interface AnalysisResult {
  overall_score: number;
  positive_feedback: StructuredPositiveFeedback;
  negative_feedback: StructuredNegativeFeedback;
  suggested_improvements: (string | ImprovementSuggestion)[];
  competitor_comparison?: CompetitorInfo[];
  historical_analysis?: HistoricalAnalysis;
}

export interface CompetitorInfo {
  name: string;
  analysis: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets: {
        uri: string;
        text: string;
        author: string;
      }[];
    }
  }
}

export interface AnalysisHistoryEntry {
  id: string;
  analysis: AnalysisResult;
  platform: SocialPlatform;
  post: string;
  date: string;
}
