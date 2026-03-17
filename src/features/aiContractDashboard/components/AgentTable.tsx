import type { JSX } from 'react';
import { Trophy } from 'lucide-react';
import type { AgentPerformance } from '../types';

type AgentTableProps = {
  agents: AgentPerformance[];
};

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

export const AgentTable = ({ agents }: AgentTableProps): JSX.Element => (
  <div className="ui-card p-5">
    <div className="mb-4">
      <h3 className="text-base font-semibold text-slate-900">Performance dos agentes</h3>
      <p className="text-sm text-slate-500">Ranking por volume de uso</p>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="px-3 py-2 font-medium">Agente</th>
            <th className="px-3 py-2 font-medium">Modelo</th>
            <th className="px-3 py-2 font-medium">Versao</th>
            <th className="px-3 py-2 font-medium">Uso</th>
            <th className="px-3 py-2 font-medium">Participacao</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent, index) => (
            <tr key={`${agent.nickname}-${agent.version}`} className="border-b border-slate-100 last:border-none">
              <td className="px-3 py-3 text-slate-900">
                <div className="flex items-center gap-2">
                  <span>{agent.nickname}</span>
                  {index === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <Trophy size={12} />
                      Lider
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-3 py-3 text-slate-700">{agent.model}</td>
              <td className="px-3 py-3 text-slate-700">{agent.version}</td>
              <td className="px-3 py-3 font-medium text-slate-900">{agent.usage}</td>
              <td className="px-3 py-3 text-slate-700">{formatPercent(agent.usageRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
