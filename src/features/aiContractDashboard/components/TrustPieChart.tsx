import type { JSX } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type TrustPieChartProps = {
  distribution: Record<'sim' | 'parcialmente' | 'nao', number>;
};

const dataConfig = [
  { key: 'sim', label: 'Sim', color: 'rgb(var(--accent-emerald))' },
  { key: 'parcialmente', label: 'Parcialmente', color: 'rgb(var(--accent-amber))' },
  { key: 'nao', label: 'Nao', color: 'rgb(var(--accent-red))' },
] as const;

export const TrustPieChart = ({ distribution }: TrustPieChartProps): JSX.Element => {
  const data = dataConfig.map((item) => ({
    name: item.label,
    value: distribution[item.key],
    color: item.color,
  }));

  return (
    <div className="ui-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Confiança no resumo da IA</h3>
        <p className="text-sm text-slate-500">Percepção dos usuários nas respostas</p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={64} outerRadius={96} paddingAngle={3}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number | string | undefined) => `${Number(value ?? 0).toFixed(1)}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
        {data.map((entry) => (
          <div key={entry.name} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </div>
            <p className="text-slate-900 font-medium">{entry.value.toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};
