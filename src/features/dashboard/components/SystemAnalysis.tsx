import { AlertTriangle, ArrowUpDown, CalendarClock, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import { useMemo, useState, type JSX } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSalesAnalysis } from '../hooks/useSalesAnalysis';

type SystemAnalysisProps = {
  apiBaseUrl: string;
  token: string;
  userId: number;
};

const DEFAULT_SLA_DAYS = 40;

const TIME_BINS: Array<{ label: string; min: number; max: number | null }> = [
  { label: '0-15', min: 0, max: 15 },
  { label: '16-30', min: 16, max: 30 },
  { label: '31-45', min: 31, max: 45 },
  { label: '46-60', min: 46, max: 60 },
  { label: '60+', min: 61, max: null },
];

const parseBrDate = (value: string): Date | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getPercentile = (sortedValues: number[], percentile: number): number => {
  if (sortedValues.length === 0) return 0;
  const index = (sortedValues.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
};

const formatMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  return `${month}/${year}`;
};

const getTimeBinLabel = (days: number): string => {
  const found = TIME_BINS.find((bin) => days >= bin.min && (bin.max === null || days <= bin.max));
  return found?.label ?? '60+';
};

const toMonthKey = (value: string): number | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yyyy, mm] = match;
  const year = Number(yyyy);
  const month = Number(mm);
  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) return null;
  return year * 12 + (month - 1);
};

const toCurrentMonthInput = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const SystemAnalysis = ({ apiBaseUrl, token, userId }: SystemAnalysisProps): JSX.Element => {
  const {
    rows,
    allRows,
    currentPage,
    lastPage,
    isLoading,
    isSyncing,
    isMappingAllPages,
    mappedPages,
    lastCachedAt,
    error,
    refresh,
    goToPage,
  } = useSalesAnalysis(apiBaseUrl, token, userId);
  const [minDaysFilter, setMinDaysFilter] = useState<string>('');
  const [fromMonth, setFromMonth] = useState<string>('2024-01');
  const [toMonth, setToMonth] = useState<string>(toCurrentMonthInput);
  const [slaDaysInput, setSlaDaysInput] = useState<string>(String(DEFAULT_SLA_DAYS));
  const slaDays = useMemo(() => {
    const parsed = Number(slaDaysInput);
    if (Number.isNaN(parsed) || parsed < 0) return DEFAULT_SLA_DAYS;
    return parsed;
  }, [slaDaysInput]);  

  const filteredAllRows = useMemo(() => {
    const startKey = toMonthKey(fromMonth);
    const endKey = toMonthKey(toMonth);
    if (startKey === null || endKey === null) return allRows;

    const realStart = Math.min(startKey, endKey);
    const realEnd = Math.max(startKey, endKey);

    return allRows.filter((row) => {
      const assinaturaDate = parseBrDate(row.assinatura);
      const escrituraDate = parseBrDate(row.escritura);

      if (!assinaturaDate || !escrituraDate) return false;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // remove hora para comparar só data

      // 🔹 Filtro 1: mês da assinatura
      const assinaturaMonthKey =
        assinaturaDate.getFullYear() * 12 + assinaturaDate.getMonth();

      const isInMonthRange =
        assinaturaMonthKey >= realStart &&
        assinaturaMonthKey <= realEnd;

      // 🔹 Filtro 2: escritura maior que hoje
      const isEscrituraFuture = escrituraDate > hoje;
      if(isEscrituraFuture) console.log("Processo com escritura maior que hoje: ", row);

      return isInMonthRange && !isEscrituraFuture;
    });
  }, [allRows, fromMonth, toMonth]);

  const filteredPageRows = useMemo(() => {
    const allowedIds = new Set(filteredAllRows.map((row) => row.id));
    return rows.filter((row) => allowedIds.has(row.id));
  }, [filteredAllRows, rows]);

  const filteredRows = useMemo(() => {
    const min = Number(minDaysFilter);
    if (!minDaysFilter || Number.isNaN(min) || min < 0) return filteredPageRows;

    return filteredPageRows.filter((row) => row.tempoDias !== null && row.tempoDias >= min);
  }, [filteredPageRows, minDaysFilter]);

  const averageDays = useMemo(() => {
    const valid = filteredAllRows.map((row) => row.tempoDias).filter((value): value is number => value !== null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((acc, value) => acc + value, 0) / valid.length);
  }, [filteredAllRows]);

  const medianDays = useMemo(() => {
    const valid = filteredAllRows
      .map((row) => row.tempoDias)
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);
    if (valid.length === 0) return null;
    const middleIndex = Math.floor(valid.length / 2);
    if (valid.length % 2 !== 0) return valid[middleIndex];
    return Math.round((valid[middleIndex - 1] + valid[middleIndex]) / 2);
  }, [filteredAllRows]);

  const modeDays = useMemo(() => {
    const valid = filteredAllRows.map((row) => row.tempoDias).filter((value): value is number => value !== null);
    if (valid.length === 0) return null;

    const counts = new Map<number, number>();
    let bestValue = valid[0];
    let bestCount = 1;

    valid.forEach((value) => {
      const count = (counts.get(value) ?? 0) + 1;
      counts.set(value, count);

      if (count > bestCount || (count === bestCount && value < bestValue)) {
        bestCount = count;
        bestValue = value;
      }
    });
    return bestValue;
  }, [filteredAllRows]);

  const averageCashDays = useMemo(() => {
    const valid = filteredAllRows
      .filter((row) => row.formaPagamento === 'A vista')
      .map((row) => row.tempoDias)
      .filter((value): value is number => value !== null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((acc, value) => acc + value, 0) / valid.length);
  }, [filteredAllRows]);

  const averageFinancedDays = useMemo(() => {
    const valid = filteredAllRows
      .filter((row) => row.formaPagamento === 'Financiamento')
      .map((row) => row.tempoDias)
      .filter((value): value is number => value !== null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((acc, value) => acc + value, 0) / valid.length);
  }, [filteredAllRows]);

  const histogramData = useMemo(() => {
    const valid = filteredAllRows.map((row) => row.tempoDias).filter((value): value is number => value !== null);
    return TIME_BINS.map((bin) => ({
      faixa: bin.label,
      quantidade: valid.filter((value) => value >= bin.min && (bin.max === null || value <= bin.max)).length,
    }));
  }, [filteredAllRows]);

  const monthlyTrendData = useMemo(() => {
    const grouped = new Map<string, { total: number; count: number }>();
    
    filteredAllRows.forEach((row) => {
      if (row.tempoDias === null) return;
      const assinaturaDate = parseBrDate(row.assinatura);
      if (!assinaturaDate) return;
      
      const monthKey = `${assinaturaDate.getFullYear()}-${String(assinaturaDate.getMonth() + 1).padStart(2, '0')}`;
      const previous = grouped.get(monthKey) ?? { total: 0, count: 0 };
      
      grouped.set(monthKey, { total: previous.total + row.tempoDias, count: previous.count + 1 });
    });

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([month, values]) => ({
        month,
        label: formatMonthLabel(month),
        mediaDias: Math.round(values.total / values.count),
      }));
  }, [filteredAllRows]);

  const managerStackedData = useMemo(() => {
    const grouped = new Map<string, { total: number; aboveSla: number }>();

    filteredAllRows.forEach((row) => {
      const key = `${row.gerente} / ${row.posVenda}`;
      const previous = grouped.get(key) ?? { total: 0, aboveSla: 0 };
      const aboveSla = row.tempoDias !== null && row.tempoDias > slaDays ? 1 : 0;
      grouped.set(key, { total: previous.total + 1, aboveSla: previous.aboveSla + aboveSla });
    });

    return Array.from(grouped.entries())
      .map(([responsavel, values]) => ({
        responsavel,
        dentroSla: values.total - values.aboveSla,
        acimaSla: values.aboveSla,
        total: values.total,
        percentualAcimaSla: values.total > 0 ? Math.round((values.aboveSla / values.total) * 100) : 0,
      }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 8);
  }, [filteredAllRows, slaDays]);

  const boxplotData = useMemo(() => {
    const build = (label: 'A vista' | 'Financiamento') => {
      const values = filteredAllRows
        .filter((row) => row.formaPagamento === label)
        .map((row) => row.tempoDias)
        .filter((value): value is number => value !== null)
        .sort((a, b) => a - b);

      if (values.length === 0) {
        return {
          label,
          count: 0,
          min: 0,
          q1: 0,
          median: 0,
          q3: 0,
          max: 0,
          whiskerMin: 0,
          whiskerMax: 0,
          outliers: [] as number[],
        };
      }

      const q1 = getPercentile(values, 0.25);
      const median = getPercentile(values, 0.5);
      const q3 = getPercentile(values, 0.75);
      const iqr = q3 - q1;
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;
      const nonOutliers = values.filter((value) => value >= lowerFence && value <= upperFence);
      const outliers = values.filter((value) => value < lowerFence || value > upperFence);

      return {
        label,
        count: values.length,
        min: values[0],
        q1: Math.round(q1),
        median: Math.round(median),
        q3: Math.round(q3),
        max: values[values.length - 1],
        whiskerMin: nonOutliers[0] ?? values[0],
        whiskerMax: nonOutliers[nonOutliers.length - 1] ?? values[values.length - 1],
        outliers,
      };
    };

    return [build('A vista'), build('Financiamento')];
  }, [filteredAllRows]);

  const heatmapData = useMemo(() => {
    const managerCounts = new Map<string, number>();
    filteredAllRows.forEach((row) => {
      managerCounts.set(row.gerente, (managerCounts.get(row.gerente) ?? 0) + 1);
    });

    const topManagers = Array.from(managerCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([manager]) => manager);

    const rowsByManager = topManagers.map((manager) => {
      const cells = TIME_BINS.map((bin) => ({ faixa: bin.label, count: 0 }));
      const faixaToIndex = new Map(cells.map((cell, index) => [cell.faixa, index]));

      filteredAllRows
        .filter((row) => row.gerente === manager)
        .forEach((row) => {
          if (row.tempoDias === null) return;
          const label = getTimeBinLabel(row.tempoDias);
          const index = faixaToIndex.get(label);
          if (index === undefined) return;
          cells[index].count += 1;
        });

      return { manager, cells };
    });

    const maxCell = Math.max(1, ...rowsByManager.flatMap((row) => row.cells.map((cell) => cell.count)));
    return { rows: rowsByManager, maxCell };
  }, [filteredAllRows]);

  const mappingProgress = lastPage > 0 ? Math.min(100, Math.round((mappedPages / lastPage) * 100)) : 0;
  const cacheUpdatedLabel = useMemo(() => {
    if (!lastCachedAt) return 'Cache local ainda nao sincronizado';
    const date = new Date(lastCachedAt);
    if (Number.isNaN(date.getTime())) return 'Cache local ainda nao sincronizado';
    return `Cache local: ${date.toLocaleString('pt-BR')}`;
  }, [lastCachedAt]);

  const boxplotScaleMax = useMemo(() => {
    const maxValue = Math.max(...boxplotData.map((item) => item.whiskerMax), 1);
    return maxValue;
  }, [boxplotData]);

  const boxplotScaleMin = useMemo(() => {
    return Math.min(...boxplotData.map((item) => item.whiskerMin));
  }, [boxplotData]);

  const toPercent = (value: number): number => {
    const range = boxplotScaleMax - boxplotScaleMin;
    if (range === 0) return 0;
    return ((value - boxplotScaleMin) / range) * 100;
  };

  const getHeatmapColor = (count: number): string => {
    const opacity = count / heatmapData.maxCell;
    return `rgba(14, 116, 144, ${0.1 + opacity * 0.9})`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600 font-medium">A carregar analise de vendas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}
      {isMappingAllPages && (
        <div className="ui-card p-4">
          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>Mapeando todas as paginas para consolidar os graficos...</span>
            <span className="font-semibold">
              {mappedPages}/{lastPage} paginas ({mappingProgress}%)
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${mappingProgress}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="ui-card p-5">
          <p className="text-sm text-slate-500">Tempo medio assinatura ate escritura</p>
          <div className="mt-2 flex items-center gap-3">
            <CalendarClock className="text-blue-500" size={20} />
            <span className="text-3xl font-bold">{averageDays !== null ? `${averageDays} dias` : '--'}</span>
          </div>
        </div>

        <div className="ui-card p-5">
          <p className="text-sm text-slate-500">Mediana assinatura ate escritura</p>
          <div className="mt-2 flex items-center gap-3">
            <ListChecks className="text-emerald-500" size={20} />
            <span className="text-3xl font-bold">{medianDays !== null ? `${medianDays} dias` : '--'}</span>
          </div>
        </div>

        <div className="ui-card p-5">
          <p className="text-sm text-slate-500">Moda assinatura ate escritura</p>
          <div className="mt-2 flex items-center gap-3">
            <ListChecks className="text-cyan-500" size={20} />
            <span className="text-3xl font-bold">{modeDays !== null ? `${modeDays} dias` : '--'}</span>
          </div>
        </div>

        <div className="ui-card p-5">
          <p className="text-sm text-slate-500">Tempo medio vendas a vista</p>
          <div className="mt-2 flex items-center gap-3">
            <ListChecks className="text-amber-500" size={20} />
            <span className="text-3xl font-bold">{averageCashDays !== null ? `${averageCashDays} dias` : '--'}</span>
          </div>
        </div>

        <div className="ui-card p-5">
          <p className="text-sm text-slate-500">Tempo medio vendas financiadas</p>
          <div className="mt-2 flex items-center gap-3">
            <ListChecks className="text-fuchsia-500" size={20} />
            <span className="text-3xl font-bold">{averageFinancedDays !== null ? `${averageFinancedDays} dias` : '--'}</span>
          </div>
        </div>
      </div>

      <div className="ui-card p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="from-month" className="text-xs font-medium text-slate-600">
              Assinatura de (mes/ano)
            </label>
            <input
              id="from-month"
              type="month"
              value={fromMonth}
              onChange={(event) => setFromMonth(event.target.value)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="to-month" className="text-xs font-medium text-slate-600">
              Assinatura ate (mes/ano)
            </label>
            <input
              id="to-month"
              type="month"
              value={toMonth}
              onChange={(event) => setToMonth(event.target.value)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
            />
          </div>
          <p className="text-xs text-slate-500">
            Intervalo aplicado em cards, graficos e tabela.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="ui-card p-5">
          <h3 className="text-base font-bold text-slate-900 mb-4">Histograma de tempo (dias)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="faixa" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--code-bg))' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgb(var(--panel))',
                    opacity: 0.95,
                    color: 'rgb(var(--text-strong))',
                  }} />
                <Bar dataKey="quantidade" name="Volume" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ui-card p-5">
          <h3 className="text-base font-bold text-slate-900 mb-4">Serie mensal de tempo medio</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
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
                <Line type="monotone" dataKey="mediaDias" name="Media (dias)" stroke="#0ea5e9" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="ui-card p-5">
          <h3 className="text-base font-bold text-slate-900 mb-4">Boxplot por forma de pagamento</h3>
          <div className="space-y-6">
            {boxplotData.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-700">{item.label}</span>
                  <span className="text-slate-500">{item.count} vendas</span>
                </div>
                <div className="relative h-10 rounded-lg bg-slate-50 border border-slate-100">
                  <div
                    className="absolute top-1/2 h-0.5 bg-slate-400 -translate-y-1/2"
                    style={{
                      left: `${toPercent(item.whiskerMin)}%`,
                      width: `${Math.max(1, toPercent(item.whiskerMax) - toPercent(item.whiskerMin))}%`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 h-6 -translate-y-1/2 rounded bg-blue-200 border border-blue-300"
                    style={{
                      left: `${toPercent(item.q1)}%`,
                      width: `${Math.max(1, toPercent(item.q3) - toPercent(item.q1))}%`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 w-0.5 h-6 bg-blue-900 -translate-y-1/2"
                    style={{ left: `${toPercent(item.median)}%` }}
                  />
                  {item.outliers.slice(0, 8).map((value, index) => (
                    <div
                      key={`${item.label}-${value}-${index}`}
                      className="absolute top-1/2 w-2 h-2 rounded-full bg-rose-500 -translate-y-1/2 -translate-x-1/2"
                      style={{ left: `${Math.min(100, toPercent(value))}%` }}
                      title={`Outlier: ${value} dias`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Min {item.min} | Q1 {item.q1} | Mediana {item.median} | Q3 {item.q3} | Max {item.max}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="ui-card p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900">Volume e % acima do SLA (&gt; {slaDays} dias)</h3>
            <div className="flex items-center gap-2">
              <label htmlFor="sla-days-input" className="text-xs font-medium text-slate-600">
                SLA (dias)
              </label>
              <input
                id="sla-days-input"
                type="number"
                min={0}
                value={slaDaysInput}
                onChange={(event) => setSlaDaysInput(event.target.value)}
                className="h-9 w-24 rounded-md border border-slate-200 px-2 text-sm"
              />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={managerStackedData} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  width={170}
                  dataKey="responsavel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--code-bg))' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgb(var(--panel))',
                    opacity: 0.95,
                    color: 'rgb(var(--text-strong))',
                  }} />
                <Legend />
                <Bar dataKey="dentroSla" name="Dentro SLA" stackId="sla" fill="#22c55e" />
                <Bar dataKey="acimaSla" name="Acima SLA" stackId="sla" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500">
            {managerStackedData.map((item) => (
              <div key={`pct-${item.responsavel}`}>
                {item.responsavel}: {item.percentualAcimaSla}% acima do SLA
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ui-card p-5">
        <h3 className="text-base font-bold text-slate-900 mb-4">Heatmap gerente x faixa de tempo</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-xs text-slate-500">Gerente</th>
                {TIME_BINS.map((bin) => (
                  <th key={`heat-head-${bin.label}`} className="p-2 text-xs text-slate-500 text-center">
                    {bin.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.rows.map((row) => (
                <tr key={`heat-row-${row.manager}`}>
                  <td className="p-2 text-sm font-medium text-slate-700">{row.manager}</td>
                  {row.cells.map((cell) => (
                    <td key={`heat-${row.manager}-${cell.faixa}`} className="p-2 text-center">
                      <div
                        className="h-8 rounded-md flex items-center justify-center text-xs font-semibold text-slate-900"
                        style={{ backgroundColor: getHeatmapColor(cell.count) }}
                      >
                        {cell.count}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ui-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 ui-panel sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Ultimas vendas finalizadas</h3>
            <p className="text-sm text-slate-500">
              Pagina {currentPage} de {lastPage} | Total no intervalo: {filteredAllRows.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 whitespace-nowrap" htmlFor="min-days-filter">
              Tempo a partir de:
            </label>
            <input
              id="min-days-filter"
              type="number"
              min={0}
              value={minDaysFilter}
              onChange={(event) => setMinDaysFilter(event.target.value)}
              className="h-9 w-28 rounded-md border border-slate-200 px-2 text-sm"
              placeholder="Ex.: 40"
            />
            <button
              onClick={() => void refresh()}
              className="ui-button flex items-center gap-2 disabled:opacity-60"
              disabled={isSyncing}
            >
              <ArrowUpDown size={16} /> Atualizar cache local
            </button>
          </div>
        </div>
        <div className="px-5 py-2 text-xs font-medium text-slate-500 border-b border-slate-100 bg-slate-50/70">
          {cacheUpdatedLabel}
        </div>
        {isSyncing && (
          <div className="px-5 py-2 text-xs font-medium text-slate-500 border-b border-slate-100 bg-slate-50/70">
            Sincronizando paginas em cache...
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase">
                <th className="px-6 py-4">Processo</th>
                <th className="px-6 py-4">Data assinatura</th>
                <th className="px-6 py-4">Data escritura</th>
                <th className="px-6 py-4">Tempo</th>
                <th className="px-6 py-4">Gerente</th>
                <th className="px-6 py-4">Pos-venda</th>
                <th className="px-6 py-4">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold uppercase">PROC-{row.processoId}</td>
                  <td className="px-6 py-4">{row.assinatura || '--'}</td>
                  <td className="px-6 py-4">{row.escritura || '--'}</td>
                  <td className="px-6 py-4">{row.tempoDias !== null ? `${row.tempoDias} dias` : '--'}</td>
                  <td className="px-6 py-4">{row.gerente}</td>
                  <td className="px-6 py-4">{row.posVenda}</td>
                  <td className="px-6 py-4">{row.formaPagamento}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRows.length === 0 && !isSyncing && (
            <div className="p-16 text-center text-slate-500">Nenhuma venda finalizada encontrada para esta pagina.</div>
          )}
          {filteredRows.length === 0 && isSyncing && (
            <div className="p-16 text-center text-slate-500">A carregar dados desta pagina...</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            className="ui-button-ghost flex items-center gap-1 disabled:opacity-50"
            onClick={() => void goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <button
            className="ui-button-ghost flex items-center gap-1 disabled:opacity-50"
            onClick={() => void goToPage(currentPage + 1)}
            disabled={currentPage >= lastPage}
          >
            Proxima <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
