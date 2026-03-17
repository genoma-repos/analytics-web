import { useMemo, useState, type JSX } from 'react';
import { AlertTriangle, ArrowUpDown, CheckCircle, Eye, FileText, Info, Search, XCircle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useOcrData } from '../hooks/useOcrData';
import type { FilterKind, OcrItem } from '../types';
import { isCorrectClassification, isNotEvaluated } from '../utils/classification';
import { buildStats, filterOcrData } from '../utils/stats';
import { FilterButton } from './FilterButton';
import { MetricCard } from './MetricCard';
import { OcrDetailsModal } from './OcrDetailsModal';

type OcrAnalysisProps = {
  userName: string;
  userEmail: string;
};

export const OcrAnalysis = ({ userName, userEmail }: OcrAnalysisProps): JSX.Element => {
  const [filter, setFilter] = useState<FilterKind>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOcr, setSelectedOcr] = useState<OcrItem | null>(null);
  const { data, loading, error, showOnlyGuessed, refreshData, toggleOnlyGuessed } = useOcrData();

  const stats = useMemo(() => buildStats(data), [data]);
  const filteredData = useMemo(() => filterOcrData(data, filter, searchTerm), [data, filter, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600 font-medium">A analisar dados de OCR...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analise de Assertividade</h1>
          <p className="text-slate-500">Avaliacao de precisao do motor de classificacao de documentos</p>
          <p className="text-sm text-slate-400 mt-1">
            Usuario: {userName} ({userEmail})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => void refreshData()} className="ui-button flex items-center gap-2">
            <ArrowUpDown size={16} /> Atualizar Dados
          </button>
          <button onClick={() => void toggleOnlyGuessed()} className="ui-button flex items-center gap-2">
            {showOnlyGuessed ? 'Todos' : 'Apenas adivinhados'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total Analisado" value={stats?.total} icon={<FileText className="text-blue-500" />} variant="blue" />
        <MetricCard
          title="Assertividade"
          value={`${stats?.taxa}%`}
          icon={<CheckCircle className="text-emerald-500" />}
          variant="emerald"
          subtext={`${stats?.acertos} acertos`}
        />
        <MetricCard
          title="Erros de Classificacao"
          value={stats?.erros}
          icon={<XCircle className="text-red-500" />}
          variant="red"
          subtext={`${stats?.naoAvaliados} nao avaliados`}
        />
        <MetricCard
          title="Modelos de Doc."
          value={stats?.chartData.length}
          icon={<Info className="text-amber-500" />}
          variant="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 ui-card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Search size={18} className="text-slate-400" /> Performance por Tipo
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--code-bg))' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgb(var(--panel))',
                    opacity: 0.95,
                    color: 'rgb(var(--text-strong))',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="acertos"
                  name="Acertos"
                  fill="rgb(var(--accent-emerald))"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Bar dataKey="total" name="Volume Total" fill="#ccd2da" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ui-card p-6">
          <h3 className="text-lg font-bold mb-6">Taxa Global</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                  {stats?.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {stats?.pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ui-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 ui-panel sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar documento..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 pr-4 py-2 ui-input w-full md:w-64"
              />
            </div>
            <div className="flex ui-filter p-1">
              <FilterButton active={filter === 'todos'} onClick={() => setFilter('todos')}>
                Todos
              </FilterButton>
              <FilterButton active={filter === 'acertos'} onClick={() => setFilter('acertos')}>
                Acertos
              </FilterButton>
              <FilterButton active={filter === 'erros'} onClick={() => setFilter('erros')}>
                Falhas
              </FilterButton>
              <FilterButton active={filter === 'nao_avaliados'} onClick={() => setFilter('nao_avaliados')}>
                Nao avaliados
              </FilterButton>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            A exibir {filteredData.length} de {data.length} registos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase">
                <th className="px-6 py-4">Processo / Doc</th>
                <th className="px-6 py-4">Nome do Arquivo</th>
                <th className="px-6 py-4">Previsao IA</th>
                <th className="px-6 py-4">Rotulo Real</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredData.map((item, idx) => {
                const isCorrect = isCorrectClassification(item);
                const naoAvaliado = isNotEvaluated(item);

                return (
                  <tr key={idx} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-blue-600 font-bold uppercase">
                          PROC-{item.processo_id}
                        </span>
                        <span className="text-slate-400 text-xs">ID: {item.documento_id || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{item.nome || `Documento ${idx}`}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          isCorrect ? 'ui-badge-success' : 'ui-badge-error'
                        }`}
                      >
                        {item.tipo || 'Vazio'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 italic">
                      {item.tipo_documento?.map((entry) => entry.nome_tipo).join(' / ') || '---'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {isCorrect ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                            <CheckCircle size={14} /> Correto
                          </div>
                        ) : naoAvaliado ? (
                          <div className="flex items-center gap-1 text-amber-600 font-semibold text-xs">
                            <Info size={14} /> Nao avaliado
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                            <AlertTriangle size={14} /> Erro
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedOcr(item)} className="ui-icon-button" title="Ver texto OCR">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <Search size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500">Nenhum registo encontrado com estes criterios.</p>
            </div>
          )}
        </div>
      </div>

      {selectedOcr && <OcrDetailsModal item={selectedOcr} onClose={() => setSelectedOcr(null)} />}
    </div>
  );
};
