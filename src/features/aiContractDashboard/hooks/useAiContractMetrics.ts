import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAiAgentsPerformance,
  getAiFeedback,
  getAiKpis,
  getAiRecentFeedback,
  getAiTimeComparison,
  getAiUsage,
} from '../api/metrics';
import type { AgentPerformance, AiMetricsResponse, FeedbackItem, FeedbackQuestionRelation, TimeComparisonRow, UsageOverTimeItem } from '../types';

type MetricsSummary = {
  usageRate: number;
  avgTimeWithAi: number;
  avgTimeWithoutAi: number;
  timeSavingRate: number;
  avgRating: number;
  confidenceRate: number;
  trustDistribution: Record<'sim' | 'parcialmente' | 'nao', number>;
  totalAnalyses: number;
};

type LoadingByGroup = {
  kpis: boolean;
  usage: boolean;
  timeComparison: boolean;
  agentsPerformance: boolean;
  recentFeedback: boolean;
  feedback: boolean;
};

type EndpointErrors = Partial<Record<keyof LoadingByGroup, string>>;

type UseAiContractMetricsResult = {
  data: AiMetricsResponse;
  summary: MetricsSummary;
  usageOverTime: Array<UsageOverTimeItem & { usageRate: number }>;
  timeComparisonData: Array<{ label: string; avg_time: number }>;
  sortedAgents: AgentPerformance[];
  feedbacks: FeedbackItem[];
  isLoading: boolean;
  loadingByGroup: LoadingByGroup;
  error: string | null;
  endpointErrors: EndpointErrors;
  refresh: () => Promise<void>;
};

const initialData: AiMetricsResponse = {
  kpis: { totalAnalyses: 0, aiUsed: 0, aiUsageRate: 0 },
  usage: [],
  timeComparison: [],
  agentsPerformance: [],
  recentFeedback: [],
  feedback: [],
};

const initialLoading: LoadingByGroup = {
  kpis: true,
  usage: true,
  timeComparison: true,
  agentsPerformance: true,
  recentFeedback: true,
  feedback: true,
};

const avgSeconds = (items: TimeComparisonRow[], usedAi: boolean): number => {
  const values = items
    .filter((item) => item.used_ai === usedAi)
    .map((item) => item.analysis_screen_time_seconds)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
};

const normalizeAnswer = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const getRelationItem = <T>(relation: T | T[] | null | undefined): T | null => {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
};

const getQuestionText = (relation: FeedbackQuestionRelation): string => {
  const item = getRelationItem(relation);
  return item?.question?.trim() ?? '';
};

const buildTrustDistribution = (answers: string[]): Record<'sim' | 'parcialmente' | 'nao', number> => {
  const totals = answers.reduce(
    (acc, answer) => {
      const normalized = normalizeAnswer(answer);
      if (normalized === 'true') acc.sim += 1;
      // if (normalized === 'parcialmente') acc.parcialmente += 1;
      if (normalized === 'false') acc.nao += 1;
      return acc;
    },
    { sim: 0, parcialmente: 0, nao: 0 },
  );

  const overall = totals.sim + totals.parcialmente + totals.nao;
  if (overall === 0) return totals;

  return {
    sim: (totals.sim / overall) * 100,
    parcialmente: (totals.parcialmente / overall) * 100,
    nao: (totals.nao / overall) * 100,
  };
};

const getQuestionType = (question: string): 'helpedWork' | 'easyToFind' | 'understandWithoutFullDoc' | 'unknown' => {
  const normalized = normalizeAnswer(question);
  if (normalized.includes('ajudou') && normalized.includes('trabalho')) return 'helpedWork';
  if (normalized.includes('facil') && normalized.includes('informac') && (normalized.includes('achar') || normalized.includes('encontrar'))) {
    return 'easyToFind';
  }
  if (normalized.includes('entender') && normalized.includes('contrato') && (normalized.includes('sem ler') || normalized.includes('documento completo'))) {
    return 'understandWithoutFullDoc';
  }
  return 'unknown';
};

const parseRating = (answer: string): number | null => {
  const value = Number(answer);
  if (!Number.isFinite(value) || value < 1 || value > 5) return null;
  return value;
};

const parseBooleanAnswer = (answer: string): boolean | null => {
  const normalized = normalizeAnswer(answer);
  if (normalized === 'true' || normalized === 'sim') return true;
  if (normalized === 'false' || normalized === 'nao') return false;
  return null;
};

const buildConfidenceSummary = (
  feedback: AiMetricsResponse['feedback'],
): { confidenceRate: number; trustDistribution: Record<'sim' | 'parcialmente' | 'nao', number> } => {
  const grouped = new Map<string, { helpedWork: number | null; easyToFind: number | null; understandWithoutFullDoc: boolean | null }>();

  for (const item of feedback) {
    const analysis = getRelationItem(item.ai_contract_analysis);
    const groupKey = analysis?.id ?? item.id;
    const current = grouped.get(groupKey) ?? { helpedWork: null, easyToFind: null, understandWithoutFullDoc: null };
    const questionType = getQuestionType(getQuestionText(item.ai_questions));

    if (questionType === 'helpedWork') {
      current.helpedWork = parseRating(item.answer);
    } else if (questionType === 'easyToFind') {
      current.easyToFind = parseRating(item.answer);
    } else if (questionType === 'understandWithoutFullDoc') {
      current.understandWithoutFullDoc = parseBooleanAnswer(item.answer);
    }
    
    grouped.set(groupKey, current);
  }

  const confidenceScores = [...grouped.values()]
    .map((entry) => {
      const parts: number[] = [];
      if (entry.helpedWork !== null) parts.push(entry.helpedWork / 5);
      if (entry.easyToFind !== null) parts.push(entry.easyToFind / 5);
      if (entry.understandWithoutFullDoc !== null) parts.push(entry.understandWithoutFullDoc ? 1 : 0);

      if (parts.length === 0) return null;
      return (parts.reduce((acc, value) => acc + value, 0) / parts.length) * 100;
    })
    .filter((score): score is number => score !== null);

  if (confidenceScores.length === 0) {
    return { confidenceRate: 0, trustDistribution: buildTrustDistribution(feedback.map((item) => item.answer)) };
  }

  const totals = confidenceScores.reduce(
    (acc, score) => {
      if (score >= 75) acc.sim += 1;
      else if (score >= 50) acc.parcialmente += 1;
      else acc.nao += 1;
      return acc;
    },
    { sim: 0, parcialmente: 0, nao: 0 },
  );

  const confidenceRate = confidenceScores.reduce((acc, score) => acc + score, 0) / confidenceScores.length;

  return {
    confidenceRate,
    trustDistribution: {
      sim: (totals.sim / confidenceScores.length) * 100,
      parcialmente: (totals.parcialmente / confidenceScores.length) * 100,
      nao: (totals.nao / confidenceScores.length) * 100,
    },
  };
};

const buildUsageOverTime = (items: AiMetricsResponse['usage']): UsageOverTimeItem[] => {
  const buckets = new Map<string, UsageOverTimeItem>();

  for (const item of items) {
    const dateKey = item.created_at.slice(0, 10);
    const current = buckets.get(dateKey) ?? { date: dateKey, used_ai: 0, total: 0 };

    current.total += 1;
    if (item.used_ai) {
      current.used_ai += 1;
    }

    buckets.set(dateKey, current);
  }

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const buildAgentPerformance = (items: AiMetricsResponse['agentsPerformance']): AgentPerformance[] => {
  const total = items.length;
  const buckets = new Map<string, AgentPerformance>();

  for (const item of items) {
    if (!item.ai_agents) continue;

    const key = `${item.ai_agents.nickname}|${item.ai_agents.model}|${item.ai_agents.version}`;
    const current = buckets.get(key) ?? {
      nickname: item.ai_agents.nickname,
      model: item.ai_agents.model,
      version: item.ai_agents.version,
      usage: 0,
      usageRate: 0,
    };

    current.usage += 1;
    buckets.set(key, current);
  }

  return [...buckets.values()]
    .map((agent) => ({
      ...agent,
      usageRate: total > 0 ? (agent.usage / total) * 100 : 0,
    }))
    .sort((a, b) => b.usage - a.usage);
};

const buildFeedbackItems = (data: AiMetricsResponse): FeedbackItem[] => {
  if (data.feedback.length > 0) {
    return [...data.feedback]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50)
      .map((item) => {
        const analysis = getRelationItem(item.ai_contract_analysis);
        return {
          answer: item.answer,
          question: getQuestionText(item.ai_questions),
          user_name: analysis?.user_name ?? 'Nao informado',
          process_id: analysis?.process_id ?? '-',
          created_at: item.created_at,
        };
      });
  }

  return [...data.recentFeedback]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)
    .map((item) => ({
      answer: item.answer,
      question: '',
      user_name: 'Nao informado',
      process_id: '-',
      created_at: item.created_at,
    }));
};

export const useAiContractMetrics = (token: string): UseAiContractMetricsResult => {
  const [data, setData] = useState<AiMetricsResponse>(initialData);
  const [loadingByGroup, setLoadingByGroup] = useState<LoadingByGroup>(initialLoading);
  const [endpointErrors, setEndpointErrors] = useState<EndpointErrors>({});

  const setLoading = useCallback((group: keyof LoadingByGroup, value: boolean): void => {
    setLoadingByGroup((current) => ({ ...current, [group]: value }));
  }, []);

  const setEndpointError = useCallback((group: keyof LoadingByGroup, message: string | null): void => {
    setEndpointErrors((current) => {
      if (!message) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [group]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [group]: message };
    });
  }, []);

  const loadKpis = useCallback(async (): Promise<void> => {
    setLoading('kpis', true);
    setEndpointError('kpis', null);
    try {
      const kpis = await getAiKpis(token);
      setData((current) => ({ ...current, kpis }));
    } catch (err) {
      console.error(err);
      setEndpointError('kpis', 'Nao foi possivel carregar KPIs.');
    } finally {
      setLoading('kpis', false);
    }
  }, [setEndpointError, setLoading, token]);

  const loadUsage = useCallback(async (): Promise<void> => {
    setLoading('usage', true);
    setEndpointError('usage', null);
    try {
      const usage = await getAiUsage(token);
      setData((current) => ({ ...current, usage }));
    } catch (err) {
      console.error(err);
      setEndpointError('usage', 'Nao foi possivel carregar uso da IA.');
    } finally {
      setLoading('usage', false);
    }
  }, [setEndpointError, setLoading, token]);

  const loadTimeComparison = useCallback(async (): Promise<void> => {
    setLoading('timeComparison', true);
    setEndpointError('timeComparison', null);
    try {
      const timeComparison = await getAiTimeComparison(token);
      setData((current) => ({ ...current, timeComparison }));
    } catch (err) {
      console.error(err);
      setEndpointError('timeComparison', 'Nao foi possivel carregar comparativo de tempo.');
    } finally {
      setLoading('timeComparison', false);
    }
  }, [setEndpointError, setLoading, token]);

  const loadAgentsPerformance = useCallback(async (): Promise<void> => {
    setLoading('agentsPerformance', true);
    setEndpointError('agentsPerformance', null);
    try {
      const agentsPerformance = await getAiAgentsPerformance(token);
      setData((current) => ({ ...current, agentsPerformance }));
    } catch (err) {
      console.error(err);
      setEndpointError('agentsPerformance', 'Nao foi possivel carregar performance dos agentes.');
    } finally {
      setLoading('agentsPerformance', false);
    }
  }, [setEndpointError, setLoading, token]);

  const loadRecentFeedback = useCallback(async (): Promise<void> => {
    setLoading('recentFeedback', true);
    setEndpointError('recentFeedback', null);
    try {
      const recentFeedback = await getAiRecentFeedback(token);
      setData((current) => ({ ...current, recentFeedback }));
    } catch (err) {
      console.error(err);
      setEndpointError('recentFeedback', 'Nao foi possivel carregar feedback recente.');
    } finally {
      setLoading('recentFeedback', false);
    }
  }, [setEndpointError, setLoading, token]);

  const loadFeedback = useCallback(async (): Promise<void> => {
    setLoading('feedback', true);
    setEndpointError('feedback', null);
    try {
      const feedback = await getAiFeedback(token);
      setData((current) => ({ ...current, feedback }));
    } catch (err) {
      console.error(err);
      setEndpointError('feedback', 'Nao foi possivel carregar feedback detalhado.');
    } finally {
      setLoading('feedback', false);
    }
  }, [setEndpointError, setLoading, token]);

  const refresh = useCallback(async (): Promise<void> => {
    await Promise.allSettled([
      loadKpis(),
      loadUsage(),
      loadTimeComparison(),
      loadAgentsPerformance(),
      loadRecentFeedback(),
      loadFeedback(),
    ]);
  }, [loadAgentsPerformance, loadFeedback, loadKpis, loadRecentFeedback, loadTimeComparison, loadUsage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo<MetricsSummary>(() => {
    const totalAnalyses = Number(data.kpis.totalAnalyses ?? data.usage.length ?? 0);
    const usageRate = Number((data.kpis.aiUsageRate ?? 0) * 100);
    const avgTimeWithAi = avgSeconds(data.timeComparison, true);
    const avgTimeWithoutAi = avgSeconds(data.timeComparison, false);
    const timeSavingRate = avgTimeWithoutAi > 0 ? ((avgTimeWithoutAi - avgTimeWithAi) / avgTimeWithoutAi) * 100 : 0;

    const numericRatings = data.feedback
      .map((item) => Number(item.answer))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);
    const avgRating =
      numericRatings.length > 0 ? numericRatings.reduce((acc, value) => acc + value, 0) / numericRatings.length : 0;

    const confidenceSummary = buildConfidenceSummary(data.feedback);

    return {
      usageRate,
      avgTimeWithAi,
      avgTimeWithoutAi,
      timeSavingRate,
      avgRating,
      confidenceRate: confidenceSummary.confidenceRate,
      trustDistribution: confidenceSummary.trustDistribution,
      totalAnalyses,
    };
  }, [data]);

  const usageOverTime = useMemo(
    () =>
      buildUsageOverTime(data.usage).map((item) => ({
        ...item,
        usageRate: item.total > 0 ? (item.used_ai / item.total) * 100 : 0,
      })),
    [data.usage],
  );

  const timeComparisonData = useMemo(
    () => [
      { label: 'Com IA', avg_time: summary.avgTimeWithAi },
      { label: 'Sem IA', avg_time: summary.avgTimeWithoutAi },
    ],
    [summary.avgTimeWithAi, summary.avgTimeWithoutAi],
  );

  const sortedAgents = useMemo(() => buildAgentPerformance(data.agentsPerformance), [data.agentsPerformance]);

  const feedbacks = useMemo(() => buildFeedbackItems(data), [data]);

  const isLoading = useMemo(() => Object.values(loadingByGroup).some(Boolean), [loadingByGroup]);

  const error = useMemo(() => Object.values(endpointErrors)[0] ?? null, [endpointErrors]);

  return {
    data,
    summary,
    usageOverTime,
    timeComparisonData,
    sortedAgents,
    feedbacks,
    isLoading,
    loadingByGroup,
    error,
    endpointErrors,
    refresh,
  };
};
