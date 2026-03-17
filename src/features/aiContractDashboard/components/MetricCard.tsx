import type { JSX, ReactNode } from 'react';

type MetricCardProps = {
  title: string;
  value: string;
  helper?: string;
  icon: ReactNode;
  footer?: ReactNode;
};

export const MetricCard = ({ title, value, helper, icon, footer }: MetricCardProps): JSX.Element => (
  <div className="ui-card p-5 flex flex-col gap-3 min-h-[148px]">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>
    </div>

    <div className="space-y-1">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    </div>

    {footer ? <div className="mt-auto">{footer}</div> : null}
  </div>
);

