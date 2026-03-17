export type KpisResponse = {
  totalAnalyses: number | null;
  aiUsed: number | null;
  aiUsageRate: number;
};

export type UsageRow = {
  created_at: string;
  used_ai: boolean;
};

export type TimeComparisonRow = {
  analysis_screen_time_seconds: number | null;
  used_ai: boolean;
};

export type AgentPerformanceRow = {
  ai_agents: {
    nickname: string;
    model: string;
    version: string;
  } | null;
};

export type RecentFeedbackRow = {
  answer: string;
  created_at: string;
};

export type FeedbackQuestionRelation =
  | {
      question: string;
    }
  | Array<{
      question: string;
    }>
  | null;

export type FeedbackAnalysisRelation =
  | {
      id: string;
      user_name: string;
      process_id: string;
    }
  | Array<{
      id: string;
      user_name: string;
      process_id: string;
    }>
  | null;

export type FeedbackDetailRow = {
  id: string;
  answer: string;
  created_at: string;
  ai_questions: FeedbackQuestionRelation;
  ai_contract_analysis: FeedbackAnalysisRelation;
};

export type UsageOverTimeItem = {
  date: string;
  used_ai: number;
  total: number;
};

export type AgentPerformance = {
  nickname: string;
  model: string;
  version: string;
  usage: number;
  usageRate: number;
};

export type FeedbackItem = {
  answer: string;
  question: string;
  user_name: string;
  process_id: string;
  created_at: string;
};

export type AiMetricsResponse = {
  kpis: KpisResponse;
  usage: UsageRow[];
  timeComparison: TimeComparisonRow[];
  agentsPerformance: AgentPerformanceRow[];
  recentFeedback: RecentFeedbackRow[];
  feedback: FeedbackDetailRow[];
};
