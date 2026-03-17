import type { ChartItem, FilterKind, OcrItem, Stats } from '../types';
import { getRegisteredTypes, isCorrectClassification, isNotEvaluated } from './classification';

export const buildStats = (data: OcrItem[]): Stats | null => {
  if (!data.length) return null;

  let acertosCount = 0;
  let naoAvaliadosCount = 0;
  const distribuicao: Record<string, ChartItem> = {};

  data.forEach((item) => {
    const tiposCadastrados = getRegisteredTypes(item);
    const naoAvaliado = isNotEvaluated(item);
    const isCorrect = isCorrectClassification(item);

    if (naoAvaliado) naoAvaliadosCount++;
    if (isCorrect) acertosCount++;

    const label = tiposCadastrados.join(' / ') || 'Nao Classificado';
    if (!distribuicao[label]) {
      distribuicao[label] = { name: label.toUpperCase(), acertos: 0, total: 0 };
    }

    distribuicao[label].total++;
    if (isCorrect) distribuicao[label].acertos++;
  });

  const total = data.length;
  const errosCount = total - acertosCount - naoAvaliadosCount;
  const avaliados = total - naoAvaliadosCount;
  const taxa = (avaliados > 0 ? (acertosCount / avaliados) * 100 : 0).toFixed(1);

  return {
    total,
    acertos: acertosCount,
    erros: errosCount,
    naoAvaliados: naoAvaliadosCount,
    taxa,
    chartData: Object.values(distribuicao),
    pieData: [
      { name: 'Acertos', value: acertosCount, color: '#10b981' },
      { name: 'Erros', value: errosCount, color: '#ef4444' },
      { name: 'Nao Avaliados', value: naoAvaliadosCount, color: '#f59e0b' },
    ],
  };
};

export const filterOcrData = (data: OcrItem[], filter: FilterKind, searchTerm: string): OcrItem[] => {
  const lowerSearch = searchTerm.toLowerCase();

  return data.filter((item) => {
    const isCorrect = isCorrectClassification(item);
    const naoAvaliado = isNotEvaluated(item);

    const matchesFilter =
      filter === 'todos'
        ? true
        : filter === 'acertos'
          ? isCorrect
          : filter === 'erros'
            ? !isCorrect && !naoAvaliado
            : naoAvaliado;

    const matchesSearch =
      (item.nome || '').toLowerCase().includes(lowerSearch) ||
      (item.tipo || '').toLowerCase().includes(lowerSearch);

    return matchesFilter && matchesSearch;
  });
};
