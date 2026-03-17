import type { JSX } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type TimeComparisonChartProps = {
  data: Array<{ label: string; avg_time: number }>;
};

const colors = ['rgb(var(--accent-blue))', 'rgb(var(--accent-amber))'];

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  return `${(seconds / 60).toFixed(1)} min`;
};

export const TimeComparisonChart = ({ data }: TimeComparisonChartProps): JSX.Element => (
  <div className="ui-card p-5">
    <div className="mb-4">
      <h3 className="text-base font-semibold text-slate-900">Tempo médio de análise</h3>
      <p className="text-sm text-slate-500">Comparação do tempo com e sem IA</p>
    </div>

    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" />
          <XAxis dataKey="label" stroke="rgb(var(--text-soft))" fontSize={12} />
          <YAxis stroke="rgb(var(--text-soft))" fontSize={12} tickFormatter={(value) => formatDuration(value)} />
          <Tooltip
            formatter={(value: number | string | undefined) => {
              const numeric = Number(value ?? 0);
              return [formatDuration(numeric), 'Tempo medio'];
            }}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid rgb(var(--border))',
              backgroundColor: 'rgb(var(--panel))',
            }}
          />
          <Bar dataKey="avg_time" radius={[8, 8, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`time-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
