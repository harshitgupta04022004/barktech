import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PAGINATION_DEFAULTS } from '@/lib/constants';

interface UsePaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  pageParam?: string;
  limitParam?: string;
}

interface UsePaginationReturn {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  totalPages: number;
  total: number;
  setTotal: (total: number) => void;
  offset: number;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const {
    defaultPage = PAGINATION_DEFAULTS.PAGE,
    defaultLimit = PAGINATION_DEFAULTS.LIMIT,
    pageParam = 'page',
    limitParam = 'limit',
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const [total, setTotal] = useState(0);

  const page = useMemo(() => {
    const parsed = parseInt(searchParams.get(pageParam) || '', 10);
    return isNaN(parsed) || parsed < 1 ? defaultPage : parsed;
  }, [searchParams, pageParam, defaultPage]);

  const limit = useMemo(() => {
    const parsed = parseInt(searchParams.get(limitParam) || '', 10);
    if (isNaN(parsed) || parsed < 1) return defaultLimit;
    return Math.min(parsed, PAGINATION_DEFAULTS.MAX_LIMIT);
  }, [searchParams, limitParam, defaultLimit]);

  const totalPages = useMemo(() => {
    return total > 0 ? Math.ceil(total / limit) : 0;
  }, [total, limit]);

  const updateParams = useCallback(
    (updates: Record<string, string | number>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value === '' || value === undefined || value === null) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        }
        // Always clean up default values
        if (next.get(pageParam) === String(defaultPage)) {
          next.delete(pageParam);
        }
        if (next.get(limitParam) === String(defaultLimit)) {
          next.delete(limitParam);
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams, pageParam, limitParam, defaultPage, defaultLimit]
  );

  const setPage = useCallback(
    (newPage: number) => {
      updateParams({ [pageParam]: Math.max(1, newPage) });
    },
    [updateParams, pageParam]
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      const clamped = Math.min(Math.max(1, newLimit), PAGINATION_DEFAULTS.MAX_LIMIT);
      updateParams({ [limitParam]: clamped, [pageParam]: 1 });
    },
    [updateParams, pageParam, limitParam]
  );

  const goToNextPage = useCallback(() => {
    if (totalPages === 0 || page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages, setPage]);

  const goToPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page, setPage]);

  const goToFirstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const goToLastPage = useCallback(() => {
    if (totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, setPage]);

  const offset = useMemo(() => (page - 1) * limit, [page, limit]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    totalPages,
    total,
    setTotal,
    offset,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    hasNextPage: totalPages > 0 && page < totalPages,
    hasPreviousPage: page > 1,
  };
}
