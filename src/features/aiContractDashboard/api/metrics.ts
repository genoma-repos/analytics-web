import type {
  AgentPerformanceRow,
  FeedbackDetailRow,
  KpisResponse,
  RecentFeedbackRow,
  TimeComparisonRow,
  UsageRow,
} from '../types';

const URL = 'https://analytics-server-flax.vercel.app';

const fetchJson = async <T>(path: string, token: string): Promise<T> => {
  const response = await fetch(URL + path, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path} (${response.status})`);
  }

  return (await response.json()) as T;
};

export const getAiKpis = async (token: string): Promise<KpisResponse> => fetchJson<KpisResponse>('/api/ai/kpis', token);

export const getAiUsage = async (token: string): Promise<UsageRow[]> => fetchJson<UsageRow[]>('/api/ai/usage', token);

export const getAiTimeComparison = async (token: string): Promise<TimeComparisonRow[]> =>
  fetchJson<TimeComparisonRow[]>('/api/ai/time-comparison', token);

export const getAiAgentsPerformance = async (token: string): Promise<AgentPerformanceRow[]> =>
  fetchJson<AgentPerformanceRow[]>('/api/ai/agents-performance', token);

export const getAiRecentFeedback = async (token: string): Promise<RecentFeedbackRow[]> =>
  fetchJson<RecentFeedbackRow[]>('/api/ai/recent-feedback', token);

export const getAiFeedback = async (token: string): Promise<FeedbackDetailRow[]> =>
  fetchJson<FeedbackDetailRow[]>('/api/ai-feedback', token);
