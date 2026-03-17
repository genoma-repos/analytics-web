import type { JSX } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { UsageOverTimeItem } from '../types';

type UsageChartProps = {
  data: Array<UsageOverTimeItem & { usageRate: number }>;
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const UsageChart = ({ data }: UsageChartProps): JSX.Element => (
  <div className="ui-card p-5">
    <div className="mb-4">
      <h3 className="text-base font-semibold text-slate-900">Adoção da IA ao longo do tempo</h3>
      <p className="text-sm text-slate-500">% de análises com IA por dia</p>
    </div>

    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" />
          <XAxis dataKey="date" tickFormatter={formatDate} stroke="rgb(var(--text-soft))" fontSize={12} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="rgb(var(--text-soft))"
            fontSize={12}
          />
          <Tooltip
            formatter={(value: number | string | undefined) => {
              const numeric = Number(value ?? 0);
              return [`${numeric.toFixed(1)}%`, 'Uso da IA'];
            }}
            labelFormatter={(value) => formatDate(String(value))}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid rgb(var(--border))',
              backgroundColor: 'rgb(var(--panel))',
            }}
          />
          <Line type="monotone" dataKey="usageRate" stroke="rgb(var(--accent-blue))" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);
