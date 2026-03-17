import type { OcrItem } from '../types';

export const normalizeType = (value?: string | null): string => (value || '').toLowerCase().trim();

export const getPredictedTypes = (tipo?: string | null): string[] =>
  normalizeType(tipo)
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export const getRegisteredTypes = (item: OcrItem): string[] =>
  (item.tipo_documento || [])
    .map((entry) => normalizeType(entry.nome_tipo))
    .filter((entry) => entry.length > 0);

export const hasEmptyRegisteredType = (item: OcrItem): boolean =>
  !item.tipo_documento?.[0] ||
  (item.tipo_documento || []).some((entry) => normalizeType(entry.nome_tipo) === '');

export const isNotEvaluated = (item: OcrItem): boolean =>
  normalizeType(item.tipo) === 'desconecido' || hasEmptyRegisteredType(item);

export const isCorrectClassification = (item: OcrItem): boolean => {
  if (isNotEvaluated(item)) return false;

  const predicted = getPredictedTypes(item.tipo);
  const registered = getRegisteredTypes(item);
  return predicted.some((entry) => registered.includes(entry));
};
