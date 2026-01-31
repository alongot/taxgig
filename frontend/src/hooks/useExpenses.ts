import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import type { ManualExpense, CreateExpenseInput, CreateMileageInput, PaginatedResponse, ExpenseCategory, ApiResponse, Transaction } from '@/types';

interface ExpenseFilters {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  is_mileage?: boolean;
  category_id?: string;
  source?: 'all' | 'manual' | 'synced';
}

// Unified expense item that can be either manual or from Plaid
export interface UnifiedExpense {
  id: string;
  source: 'manual' | 'synced';
  date: string;
  amount: number;
  merchant: string;
  description?: string;
  category_name: string;
  category_id?: string;
  is_business: boolean;
  is_mileage: boolean;
  miles?: number;
  mileage_rate?: number;
  // Original data references
  manual_expense?: ManualExpense;
  transaction?: Transaction;
}

interface UseExpensesReturn {
  expenses: ManualExpense[];
  allExpenses: UnifiedExpense[];
  syncedExpenses: Transaction[];
  categories: ExpenseCategory[];
  mileageRate: number;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ExpenseFilters;
  setFilters: (filters: ExpenseFilters) => void;
  createExpense: (data: CreateExpenseInput) => Promise<ManualExpense>;
  createMileageExpense: (data: CreateMileageInput) => Promise<ManualExpense>;
  updateExpense: (id: string, data: Partial<CreateExpenseInput>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useExpenses(initialFilters: ExpenseFilters = {}): UseExpensesReturn {
  const [expenses, setExpenses] = useState<ManualExpense[]>([]);
  const [syncedExpenses, setSyncedExpenses] = useState<Transaction[]>([]);
  const [allExpenses, setAllExpenses] = useState<UnifiedExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [mileageRate, setMileageRate] = useState(0.67);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number | boolean> = {
        page: filters.page || 1,
        limit: filters.limit || 20,
      };

      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.is_mileage !== undefined) params.is_mileage = filters.is_mileage;
      if (filters.category_id) params.category_id = filters.category_id;

      // Fetch manual expenses
      const manualResponse = await api.get<PaginatedResponse<ManualExpense>>('/expenses', { params });
      const manualData = manualResponse.data?.data;
      const manualExpenses = Array.isArray(manualData) ? manualData : [];
      setExpenses(manualExpenses);

      // Fetch synced transactions (expenses only)
      const txParams: Record<string, string | number | boolean> = {
        transaction_type: 'expense',
        is_business: true,
        limit: 100,
      };
      if (filters.start_date) txParams.start_date = filters.start_date;
      if (filters.end_date) txParams.end_date = filters.end_date;

      const txResponse = await api.get<{ data: { transactions: Transaction[] } }>('/transactions', { params: txParams });
      const txData = txResponse.data?.data?.transactions;
      const transactions = Array.isArray(txData) ? txData : [];
      setSyncedExpenses(transactions);

      // Combine into unified expenses
      const unified: UnifiedExpense[] = [];

      // Add manual expenses
      for (const exp of manualExpenses) {
        unified.push({
          id: exp.manual_expense_id,
          source: 'manual',
          date: exp.expense_date,
          amount: exp.amount,
          merchant: exp.merchant,
          category_name: exp.category_name,
          category_id: exp.category_id || undefined,
          is_business: exp.is_business,
          is_mileage: exp.is_mileage,
          miles: exp.miles || undefined,
          mileage_rate: exp.mileage_rate || undefined,
          manual_expense: exp,
        });
      }

      // Add synced transactions (filter for expenses, which have negative amounts)
      for (const tx of transactions) {
        unified.push({
          id: tx.transaction_id,
          source: 'synced',
          date: tx.transaction_date,
          amount: Math.abs(tx.amount), // Convert negative to positive for display
          merchant: tx.merchant_name || tx.description || 'Unknown',
          description: tx.description || undefined,
          category_name: tx.category_name || 'Uncategorized',
          category_id: tx.category_id || undefined,
          is_business: tx.is_business ?? true,
          is_mileage: false,
          transaction: tx,
        });
      }

      // Sort by date descending
      unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply source filter
      let filtered = unified;
      if (filters.source === 'manual') {
        filtered = unified.filter(e => e.source === 'manual');
      } else if (filters.source === 'synced') {
        filtered = unified.filter(e => e.source === 'synced');
      }

      setAllExpenses(filtered);
      setPagination(manualResponse.data?.pagination || { page: 1, limit: 20, total: filtered.length, totalPages: 1 });
    } catch (err) {
      setError(getErrorMessage(err));
      setExpenses([]);
      setSyncedExpenses([]);
      setAllExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<ExpenseCategory[]>>('/expenses/categories');
      const catData = response.data?.data;
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      // Silently fail
    }
  }, []);

  const fetchMileageRate = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<{ rate: number; year: number }>>('/expenses/mileage-rate');
      setMileageRate(response.data.data?.rate || 0.67);
    } catch (err) {
      // Use default rate
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchCategories();
    fetchMileageRate();
  }, [fetchCategories, fetchMileageRate]);

  const createExpense = useCallback(async (data: CreateExpenseInput): Promise<ManualExpense> => {
    try {
      const response = await api.post<ApiResponse<ManualExpense>>('/expenses', data);
      if (response.data.data) {
        setExpenses((prev) => [response.data.data!, ...prev]);
        return response.data.data;
      }
      throw new Error('Failed to create expense');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, []);

  const createMileageExpense = useCallback(async (data: CreateMileageInput): Promise<ManualExpense> => {
    try {
      const response = await api.post<ApiResponse<ManualExpense>>('/expenses/mileage', data);
      if (response.data.data) {
        setExpenses((prev) => [response.data.data!, ...prev]);
        return response.data.data;
      }
      throw new Error('Failed to create mileage expense');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, []);

  const updateExpense = useCallback(async (id: string, data: Partial<CreateExpenseInput>) => {
    try {
      await api.put(`/expenses/${id}`, data);
      setExpenses((prev) =>
        prev.map((e) => (e.manual_expense_id === id ? { ...e, ...data } : e))
      );
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e.manual_expense_id !== id));
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, []);

  return {
    expenses,
    allExpenses,
    syncedExpenses,
    categories,
    mileageRate,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    createExpense,
    createMileageExpense,
    updateExpense,
    deleteExpense,
    refresh: fetchExpenses,
  };
}
