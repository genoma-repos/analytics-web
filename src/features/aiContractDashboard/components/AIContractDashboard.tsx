import { useMemo, useState, type JSX } from 'react';
import { Bot, Clock3, Gauge, ShieldCheck, Star, Timer } from 'lucide-react';
import { useAiContractMetrics } from '../hooks/useAiContractMetrics';
import { AgentTable } from './AgentTable';
import { FeedbackList } from './FeedbackList';
import { InsightsPanel } from './InsightsPanel';
import { MetricCard } from './MetricCard';
import { TimeComparisonChart } from './TimeComparisonChart';
import { TrustPieChart } from './TrustPieChart';
import { UsageChart } from './UsageChart';

type AIContractDashboardProps = {
  token: string;
};

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '0s';
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  return `${(seconds / 60).toFixed(1)} min`;
};

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const formatStarsValue = (value: number): string => value.toFixed(2);

const SkeletonBlock = ({ className }: { className: string }): JSX.Element => (
  <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />
);

export const AIContractDashboard = ({ token }: AIContractDashboardProps): JSX.Element => {
  const { summary, usageOverTime, timeComparisonData, sortedAgents, feedbacks, loadingByGroup, endpointErrors, error, refresh } =
    useAiContractMetrics(token);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  const summaryLoading = loadingByGroup.kpis || loadingByGroup.timeComparison || (loadingByGroup.feedback && loadingByGroup.recentFeedback);
  const usageChartLoading = loadingByGroup.usage;
  const timeChartLoading = loadingByGroup.timeComparison;
  const agentsLoading = loadingByGroup.agentsPerformance;
  const feedbackLoading = loadingByGroup.feedback && loadingByGroup.recentFeedback;
  const trustLoading = loadingByGroup.feedback;

  const userOptions = useMemo(
    () =>
      Array.from(new Set(feedbacks.map((item) => item.user_name)))
        .filter((name) => name !== 'Nao informado')
        .sort((a, b) => a.localeCompare(b)),
    [feedbacks],
  );

  const insights = useMemo(() => {
    const topAgent = sortedAgents[0];
    return [
      `Uso da IA em ${formatPercent(summary.usageRate)} das analises.`,
      `A IA reduz o tempo medio de analise em ${formatPercent(summary.timeSavingRate)}.`,
      topAgent
        ? `Agente lider em uso: ${topAgent.nickname} (${formatPercent(topAgent.usageRate)} de participacao).`
        : 'Nenhum agente ativo encontrado no periodo.',
      `Confianca media dos resumos: ${formatPercent(summary.confidenceRate)}.`,
    ];
  }, [sortedAgents, summary.confidenceRate, summary.timeSavingRate, summary.usageRate]);

  return (
    <div className="space-y-5">
      {error ? (
        <div className="ui-card p-4 border-amber-200 bg-amber-50 text-amber-800">
          <p className="text-sm">Alguns blocos nao puderam ser carregados. Os demais dados continuam ativos.</p>
          <button className="ui-button mt-3" onClick={() => void refresh()}>
            Recarregar dados
          </button>
        </div>
      ) : null}

      <section className="ui-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">AI Contract Analysis Dashboard</h2>
            <p className="text-slate-500">Monitoramento de desempenho do agente de IA de analise contratual</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="ui-filter p-1 inline-flex">
              {(['7', '30', '90'] as const).map((item) => (
                <button
                  key={item}
                  className={`ui-filter-button ${period === item ? 'ui-filter-button-active' : ''}`}
                  onClick={() => setPeriod(item)}
                >
                  {item} dias
                </button>
              ))}
            </div>

            <select className="ui-input h-10 px-3" value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}>
              <option value="all">Agente de IA</option>
              {sortedAgents.map((agent) => (
                <option key={`${agent.nickname}-${agent.version}`} value={agent.nickname}>
                  {agent.nickname}
                </option>
              ))}
            </select>

            <select className="ui-input h-10 px-3" value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
              <option value="all">Usuario</option>
              {userOptions.map((userName) => (
                <option key={userName} value={userName}>
                  {userName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {summaryLoading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-40" />)
          : [
            <MetricCard
              key="usage-rate"
              title="Taxa de uso da IA"
              value={formatPercent(summary.usageRate)}
              helper={`${summary.totalAnalyses} analises no periodo`}
              icon={<Bot size={18} />}
            />,            
            <MetricCard
              key="rating"
              title="Nota media da IA"
              value={formatStarsValue(summary.avgRating)}
              icon={<Star size={18} />}
              footer={
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const isFilled = index < Math.round(summary.avgRating);
                    return <Star key={index} size={14} fill={isFilled ? 'currentColor' : 'none'} />;
                  })}
                </div>
              }
            />,
            <MetricCard
              key="trust"
              title="Taxa de confianca"
              value={formatPercent(summary.confidenceRate)}
              helper={`Sim ${formatPercent(summary.trustDistribution.sim)} | Parcialmente ${formatPercent(summary.trustDistribution.parcialmente)} | Nao ${formatPercent(summary.trustDistribution.nao)}`}
              icon={<ShieldCheck size={18} />}
            />,
            <MetricCard key="time-with" title="Tempo medio com IA" value={formatDuration(summary.avgTimeWithAi)} icon={<Clock3 size={18} />} />,
            <MetricCard key="time-without" title="Tempo medio sem IA" value={formatDuration(summary.avgTimeWithoutAi)} icon={<Timer size={18} />} />,
            <MetricCard key="saving" title="Economia de tempo" value={formatPercent(summary.timeSavingRate)} icon={<Gauge size={18} />} />,
          ]}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {usageChartLoading ? (
          <div className="ui-card p-5">
            <SkeletonBlock className="h-6 w-64 mb-3" />
            <SkeletonBlock className="h-72" />
          </div>
        ) : (
          <UsageChart data={usageOverTime} />
        )}

        {timeChartLoading ? (
          <div className="ui-card p-5">
            <SkeletonBlock className="h-6 w-64 mb-3" />
            <SkeletonBlock className="h-72" />
          </div>
        ) : (
          <TimeComparisonChart data={timeComparisonData} />
        )}
      </section>

      <section className="">
        <div className="xl:col-span-2">
          {agentsLoading ? (
            <div className="ui-card p-5">
              <SkeletonBlock className="h-6 w-64 mb-3" />
              <SkeletonBlock className="h-72" />
            </div>
          ) : (
            <AgentTable agents={sortedAgents} />
          )}
        </div>
      </section>      

      <section className="">
        {feedbackLoading ? (
          <div className="ui-card p-5">
            <SkeletonBlock className="h-6 w-64 mb-3" />
            <SkeletonBlock className="h-56" />
          </div>
        ) : (
          <FeedbackList feedbacks={feedbacks} />
        )}
      </section>

      <section  className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {trustLoading ? (
          <div className="ui-card p-5">
            <SkeletonBlock className="h-6 w-64 mb-3" />
            <SkeletonBlock className="h-72" />
          </div>
        ) : (
          <TrustPieChart distribution={summary.trustDistribution} />
        )}



        {summaryLoading || agentsLoading ? (
          <div className="ui-card p-5">
            <SkeletonBlock className="h-6 w-64 mb-3" />
            <SkeletonBlock className="h-56" />
          </div>
        ) : (
          <InsightsPanel insights={insights} />
        )}
      </section>

      {Object.keys(endpointErrors).length > 0 ? (
        <section className="ui-card p-4 text-xs text-slate-600">
          {Object.entries(endpointErrors).map(([group, message]) => (
            <p key={group}>{`${group}: ${message}`}</p>
          ))}
        </section>
      ) : null}
    </div>
  );
};
