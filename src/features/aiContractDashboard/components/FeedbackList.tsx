import { useMemo, useState, type JSX } from 'react';
import type { FeedbackItem } from '../types';
import { Star } from 'lucide-react';

type FeedbackListProps = {
  feedbacks: FeedbackItem[];
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const FeedbackList = ({ feedbacks }: FeedbackListProps): JSX.Element => {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [personFilter, setPersonFilter] = useState<string>('all');

  const people = useMemo(
    () =>
      Array.from(new Set(feedbacks.map((item) => item.user_name)))
        .filter((name) => name && name !== 'Nao informado')
        .sort((a, b) => a.localeCompare(b)),
    [feedbacks],
  );

  const filteredFeedbacks = useMemo(() => {
    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return feedbacks.filter((item) => {
      const createdAt = new Date(item.created_at).getTime();
      if (Number.isNaN(createdAt)) return false;
      if (personFilter !== 'all' && item.user_name !== personFilter) return false;
      if (fromTime !== null && createdAt < fromTime) return false;
      if (toTime !== null && createdAt > toTime) return false;
      return true;
    });
  }, [feedbacks, fromDate, personFilter, toDate]);

  const normalizeAnswer = (value: string) => {
    if (Number(value) > 0) return <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < Math.round(Number(value));
        return <Star key={index} size={14} fill={isFilled ? 'currentColor' : 'none'} />;
      })}
    </div>
    
    switch (value) {
      case 'true':
        return 'Sim';
      case 'false':
        return 'Não';
      default:
        return value;
    }
  };

  return (
    <div className="ui-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Feedbacks recentes</h3>
        <p className="text-sm text-slate-500">Tabela com filtros por data e pessoa</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="text-xs text-slate-600">
          De
          <input type="date" className="ui-input mt-1 h-10 w-full px-3" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>
        <label className="text-xs text-slate-600">
          Ate
          <input type="date" className="ui-input mt-1 h-10 w-full px-3" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
        <label className="text-xs text-slate-600">
          Pessoa
          <select className="ui-input mt-1 h-10 w-full px-3" value={personFilter} onChange={(event) => setPersonFilter(event.target.value)}>
            <option value="all">Todos</option>
            {people.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Pessoa</th>
              <th className="px-3 py-2 font-medium">Processo</th>
              <th className="px-3 py-2 font-medium">Pergunta</th>
              <th className="px-3 py-2 font-medium">Resposta</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedbacks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                  Nenhum feedback encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredFeedbacks.map((feedback, index) => (
                <tr key={`${feedback.user_name}-${feedback.created_at}-${index}`} className="border-b border-slate-100 last:border-none">
                  <td className="px-3 py-3 text-slate-700">{formatDate(feedback.created_at)}</td>
                  <td className="px-3 py-3 text-slate-900">{feedback.user_name}</td>
                  <td className="px-3 py-3 text-slate-700">{feedback.process_id}</td>
                  <td className="px-3 py-3 text-slate-700">{feedback.question || '-'}</td>
                  <td className="px-3 py-3 text-slate-900">{normalizeAnswer(feedback.answer)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
