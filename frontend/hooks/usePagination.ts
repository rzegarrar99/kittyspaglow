import { useState, useMemo, useEffect } from 'react';

export const usePagination = <T>(items: T[], pageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // useEffect correcto para reset — no useMemo (que es solo para cálculos)
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return { paginated, currentPage, totalPages, setCurrentPage, total: items.length };
};