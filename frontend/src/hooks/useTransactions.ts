import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import type { Transaction, TransactionFilters, PaginatedResponse, ExpenseCategory, ApiResponse } from '@/types';

interface UseTransactionsReturn {
  transactions: Transaction[];
  categories: ExpenseCategory[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  markAsReviewed: (id: string, updates?: Partial<Transaction>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTransactions(initialFilters: TransactionFilters = {}): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number | boolean> = {
        page: filters.page || 1,
        limit: filters.limit || 20,
      };

      // Add optional filters
      if (filters.account_id) params.account_id = filters.account_id;
      if (filters.transaction_type) params.transaction_type = filters.transaction_type;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.is_business !== undefined) params.is_business = filters.is_business;
      if (filters.review_required !== undefined) params.review_required = filters.review_required;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.min_amount) params.min_amount = filters.min_amount;
      if (filters.max_amount) params.max_amount = filters.max_amount;
      if (filters.search) params.search = filters.search;

      const response = await api.get<PaginatedResponse<Transaction>>('/transactions', { params });
      const data = response.data?.data;
      setTransactions(Array.isArray(data) ? data : []);
      setPagination(response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      setError(getErrorMessage(err));
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<ExpenseCategory[]>>('/transactions/categories');
      const data = response.data?.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      // Silently fail for categories
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      await api.patch(`/transactions/${id}`, updates);
      setTransactions((prev) =>
        prev.map((t) => (t.transaction_id === id ? { ...t, ...updates } : t))
      );
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, []);

  const markAsReviewed = useCallback(async (id: string, updates?: Partial<Transaction>) => {
    try {
      await api.post(`/transactions/${id}/review`, updates);
      setTransactions((prev) =>
        prev.map((t) =>
          t.transaction_id === id
            ? { ...t, ...updates, reviewed_by_user: true, review_required: false }
            : t
        )
      );
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, []);

  return {
    transactions,
    categories,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    updateTransaction,
    markAsReviewed,
    refresh: fetchTransactions,
  };
}
