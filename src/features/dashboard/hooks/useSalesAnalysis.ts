import { useCallback, useEffect, useMemo, useState } from 'react';
import { listFinalizedSales } from '../api/sales';
import type { PaginatedResponse, SaleAnalysisRow, SaleItem } from '../types';

type SalesAnalysisData = {
  rows: SaleAnalysisRow[];
  allRows: SaleAnalysisRow[];
  averageDays: number | null;
  medianDays: number | null;
  modeDays: number | null;
  averageCashDays: number | null;
  averageFinancedDays: number | null;
  currentPage: number;
  lastPage: number;
  total: number;
  isLoading: boolean;
  isSyncing: boolean;
  isMappingAllPages: boolean;
  mappedPages: number;
  lastCachedAt: string | null;
  error: string | null;
  refresh: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
};

type SalesAnalysisCache = {
  version: 1;
  savedAt: string;
  lastPage: number;
  total: number;
  pageCache: Record<number, SaleAnalysisRow[]>;
};

const SALES_ANALYSIS_CACHE_VERSION = 1 as const;

const buildCacheKey = (apiBaseUrl: string, userId: number): string => {
  const normalizedApi = apiBaseUrl.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `sales_analysis_cache_v${SALES_ANALYSIS_CACHE_VERSION}_${normalizedApi}_${userId}`;
};

const parseBrDate = (value: string): Date | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getDaysBetween = (from: string, to: string): number | null => {
  const start = parseBrDate(from);
  const end = parseBrDate(to);
  if (!start || !end) return null;

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : null;
};

const normalizePayment = (rawCode: string, rawLabel?: string | null): SaleAnalysisRow['formaPagamento'] => {
  const joined = `${rawCode || ''},${rawLabel || ''}`.toLowerCase();
  if (joined.includes('2') || joined.includes('financi')) return 'Financiamento';
  if (joined.includes('1') || joined.includes('vista')) return 'A vista';
  return 'Nao informado';
};

export const useSalesAnalysis = (
  apiBaseUrl: string,
  token: string,
  userId: number,
): SalesAnalysisData => {
  const [pageCache, setPageCache] = useState<Record<number, SaleAnalysisRow[]>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMappingAllPages, setIsMappingAllPages] = useState<boolean>(false);
  const [lastCachedAt, setLastCachedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cacheKey = useMemo(() => buildCacheKey(apiBaseUrl, userId), [apiBaseUrl, userId]);

  const mapRows = useCallback((items: SaleItem[]): SaleAnalysisRow[] => {
    return items.map((item) => ({
      ...item,
      id: item.id,
      processoId: item.processo_id,
      assinatura: item.data_assinatura,
      escritura: item.prazo_escritura,
      tempoDias: getDaysBetween(item.data_assinatura, item.prazo_escritura),
      gerente: item.nome_gerente || 'Nao informado',
      posVenda: item.nome_pos_responsavel || 'Nao informado',
      formaPagamento: normalizePayment(item.forma_pagamento, item.nome_forma_pagamento),
      isDevolvido: !!item.devolucao_id,
    }));
  }, []);

  const fetchPage = useCallback(
    async (page: number): Promise<PaginatedResponse<SaleItem>> => {
      const response = await listFinalizedSales(apiBaseUrl, token, userId, page);
      const mappedRows = mapRows(response.data);

      setPageCache((previous) => {
        if (previous[page]) return previous;
        return { ...previous, [page]: mappedRows };
      });

      setLastPage(response.last_page);
      setTotal(response.total);

      return response;
    },
    [apiBaseUrl, mapRows, token, userId],
  );

  const persistCache = useCallback(
    (cacheToSave: Record<number, SaleAnalysisRow[]>, cacheLastPage: number, cacheTotal: number): void => {
      if (typeof window === 'undefined') return;
      try {
        const payload: SalesAnalysisCache = {
          version: SALES_ANALYSIS_CACHE_VERSION,
          savedAt: new Date().toISOString(),
          lastPage: cacheLastPage,
          total: cacheTotal,
          pageCache: cacheToSave,
        };
        window.localStorage.setItem(cacheKey, JSON.stringify(payload));
        setLastCachedAt(payload.savedAt);
      } catch (err) {
        console.error('Falha ao guardar cache local de vendas.', err);
      }
    },
    [cacheKey],
  );

  const hydrateFromCache = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage.getItem(cacheKey);
      if (!raw) return false;

      const parsed = JSON.parse(raw) as Partial<SalesAnalysisCache>;      
      
      if (
        parsed.version !== SALES_ANALYSIS_CACHE_VERSION || !parsed.pageCache ||
        typeof parsed.lastPage !== 'number' ||
        typeof parsed.total !== 'number'
      ) {
        return false;
      }

      const parsedCache = parsed.pageCache as unknown as Record<number, SaleAnalysisRow[]>;      
      const loadedLastPage = Math.max(1, parsed.lastPage);
      setPageCache(parsedCache);
      setCurrentPage(1);
      setLastPage(loadedLastPage);
      setTotal(parsed.total);
      setLastCachedAt(typeof parsed.savedAt === 'string' ? parsed.savedAt : null);
      setError(null);
      return true;
    } catch (err) {
      console.error('Falha ao ler cache local de vendas.', err);
      return false;
    }
  }, [cacheKey]);

  const prefetchRemainingPages = useCallback(
    async (last: number): Promise<void> => {
      if (last <= 1) return;

      setIsMappingAllPages(true);
      setIsSyncing(true);
      try {
        const pagesToFetch = Array.from({ length: last - 1 }, (_, index) => index + 2);
        await Promise.allSettled(pagesToFetch.map((page) => fetchPage(page)));
      } finally {
        setIsMappingAllPages(false);
        setIsSyncing(false);
      }
    },
    [fetchPage],
  );

  const bootstrap = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setCurrentPage(1);
    setLastPage(1);
    setTotal(0);
    setPageCache({});
    setIsMappingAllPages(false);

    try {
      const firstPage = await fetchPage(1);
      setCurrentPage(firstPage.current_page);
      setError(null);
      setIsLoading(false);
      if (firstPage.last_page <= 1) {
        persistCache({ 1: mapRows(firstPage.data) }, firstPage.last_page, firstPage.total);
      } else {
        await prefetchRemainingPages(firstPage.last_page);
      }
    } catch (err) {
      console.error(err);
      setError('Nao foi possivel carregar as vendas finalizadas.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, mapRows, persistCache, prefetchRemainingPages]);

  useEffect(() => {
    // setIsLoading(true);
    const loadedFromCache = hydrateFromCache();
    if (!loadedFromCache) {
      void bootstrap();
      return;
    }
    setIsLoading(false);
  }, [bootstrap, hydrateFromCache]);

  useEffect(() => {
    if (isMappingAllPages) return;
    if (lastPage < 1) return;
    if (Object.keys(pageCache).length < lastPage) return;
    persistCache(pageCache, lastPage, total);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMappingAllPages]);

  const averageDays = useMemo(() => {
    const allRows = Object.values(pageCache).flat();
    const valid = allRows.map((row) => row.tempoDias).filter((value): value is number => value !== null);
    if (valid.length === 0) return null;

    const totalDays = valid.reduce((acc, value) => acc + value, 0);
    return Math.round(totalDays / valid.length);
  }, [pageCache]);

  const medianDays = useMemo(() => {
    const allRows = Object.values(pageCache).flat();
    const valid = allRows
      .map((row) => row.tempoDias)
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);

    if (valid.length === 0) return null;

    const middleIndex = Math.floor(valid.length / 2);
    if (valid.length % 2 !== 0) return valid[middleIndex];

    return Math.round((valid[middleIndex - 1] + valid[middleIndex]) / 2);
  }, [pageCache]);

  const modeDays = useMemo(() => {
    const allRows = Object.values(pageCache).flat();
    const valid = allRows.map((row) => row.tempoDias).filter((value): value is number => value !== null);
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
  }, [pageCache]);

  const averageCashDays = useMemo(() => {
    const allRows = Object.values(pageCache).flat();
    const valid = allRows
      .filter((row) => row.formaPagamento === 'A vista')
      .map((row) => row.tempoDias)
      .filter((value): value is number => value !== null);

    if (valid.length === 0) return null;
    return Math.round(valid.reduce((acc, value) => acc + value, 0) / valid.length);
  }, [pageCache]);

  const averageFinancedDays = useMemo(() => {
    const allRows = Object.values(pageCache).flat();
    const valid = allRows
      .filter((row) => row.formaPagamento === 'Financiamento')
      .map((row) => row.tempoDias)
      .filter((value): value is number => value !== null);

    if (valid.length === 0) return null;
    return Math.round(valid.reduce((acc, value) => acc + value, 0) / valid.length);
  }, [pageCache]);

  const refresh = useCallback(async (): Promise<void> => {
    await bootstrap();
  }, [bootstrap]);

  const goToPage = useCallback(
    async (page: number): Promise<void> => {
      const bounded = Math.min(Math.max(page, 1), lastPage);
      setCurrentPage(bounded);

      if (pageCache[bounded]) return;

      setIsSyncing(true);
      try {
        const response = await fetchPage(bounded);
        const mappedRows = mapRows(response.data);
        setPageCache((previous) => {
          const next = { ...previous, [bounded]: mappedRows };
          persistCache(next, Math.max(lastPage, response.last_page), response.total);
          return next;
        });
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Nao foi possivel carregar as vendas finalizadas.');
      } finally {
        setIsSyncing(false);
      }
    },
    [fetchPage, lastPage, mapRows, pageCache, persistCache],
  );

  const rows = pageCache[currentPage] ?? [];
  const allRows = Object.values(pageCache).flat();
  const mappedPages = Object.keys(pageCache).length;

  return {
    rows,
    allRows,
    averageDays,
    medianDays,
    modeDays,
    averageCashDays,
    averageFinancedDays,
    currentPage,
    lastPage,
    total,
    isLoading,
    isSyncing,
    isMappingAllPages,
    mappedPages,
    lastCachedAt,
    error,
    refresh,
    goToPage,
  };
};
