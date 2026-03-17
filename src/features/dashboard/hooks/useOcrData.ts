import { useCallback, useEffect, useState } from 'react';
import { OCR_API_URL } from '../constants';
import type { OcrItem } from '../types';

type UseOcrDataResult = {
  data: OcrItem[];
  loading: boolean;
  error: string | null;
  showOnlyGuessed: boolean;
  refreshData: () => Promise<void>;
  toggleOnlyGuessed: () => Promise<void>;
};

export const useOcrData = (): UseOcrDataResult => {
  const [data, setData] = useState<OcrItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyGuessed, setShowOnlyGuessed] = useState<boolean>(false);

  const fetchData = useCallback(async (onlyGuessed: boolean): Promise<void> => {
    setLoading(true);

    try {
      const response = await fetch(OCR_API_URL);
      if (!response.ok) throw new Error('Falha ao ligar a API');

      const json = (await response.json()) as OcrItem[];
      const sourceData = onlyGuessed ? json.filter((item) => item.tipo !== 'desconecido') : json;
      setData(sourceData.filter((item) => item.tipo_documento && item.documento_id));
      setError(null);
    } catch (err) {
      setError('Nao foi possivel carregar os dados. Verifique a API.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  const refreshData = useCallback(async (): Promise<void> => {
    await fetchData(showOnlyGuessed);
  }, [fetchData, showOnlyGuessed]);

  const toggleOnlyGuessed = useCallback(async (): Promise<void> => {
    const nextShowOnlyGuessed = !showOnlyGuessed;
    setShowOnlyGuessed(nextShowOnlyGuessed);
    await fetchData(nextShowOnlyGuessed);
  }, [fetchData, showOnlyGuessed]);

  return {
    data,
    loading,
    error,
    showOnlyGuessed,
    refreshData,
    toggleOnlyGuessed,
  };
};
