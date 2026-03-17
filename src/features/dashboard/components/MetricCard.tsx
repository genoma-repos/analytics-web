import type { JSX, ReactNode } from 'react';

type MetricCardVariant = 'blue' | 'emerald' | 'red' | 'amber';

type MetricCardProps = {
  title: string;
  value: number | string | undefined;
  icon: ReactNode;
  variant: MetricCardVariant;
  subtext?: string;
};

const iconContainerClassMap: Record<MetricCardVariant, string> = {
  blue: 'bg-blue-50',
  emerald: 'bg-emerald-50',
  red: 'bg-red-50',
  amber: 'bg-amber-50',
};

export const MetricCard = ({ title, value, icon, variant, subtext }: MetricCardProps): JSX.Element => (
  <div className="ui-card p-6 flex flex-col">
    <div className="flex items-center justify-between mb-2">
      <span className="text-slate-500 text-sm font-semibold">{title}</span>
      <div className={`p-2 rounded-lg ${iconContainerClassMap[variant]}`}>{icon}</div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      {subtext && <span className="text-xs text-slate-400 font-medium">{subtext}</span>}
    </div>
  </div>
);
