import type { JSX } from 'react';
import { Lightbulb } from 'lucide-react';

type InsightsPanelProps = {
  insights: string[];
};

export const InsightsPanel = ({ insights }: InsightsPanelProps): JSX.Element => (
  <div className="ui-card p-5">
    <div className="mb-4">
      <h3 className="text-base font-semibold text-slate-900">Insights automáticos</h3>
      <p className="text-sm text-slate-500">Resumo objetivo dos principais indicadores</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {insights.map((insight, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="mb-2 inline-flex rounded-lg bg-blue-50 p-2 text-blue-600">
            <Lightbulb size={16} />
          </div>
          <p className="text-sm text-slate-800">{insight}</p>
        </div>
      ))}
    </div>
  </div>
);

