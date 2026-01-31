import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import type { TaxEstimate, TaxSummary, TaxDeadline, TaxPayment, IncomeThreshold, ApiResponse } from '@/types';

interface UseTaxReturn {
  summary: TaxSummary | null;
  estimates: TaxEstimate[];
  deadlines: TaxDeadline[];
  payments: TaxPayment[];
  threshold: IncomeThreshold | null;
  isLoading: boolean;
  error: string | null;
  recordPayment: (data: RecordPaymentInput) => Promise<TaxPayment>;
  refresh: () => Promise<void>;
}

interface RecordPaymentInput {
  tax_year: number;
  quarter: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  confirmation_number?: string;
  notes?: string;
}

export function useTax(taxYear?: number): UseTaxReturn {
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [estimates, setEstimates] = useState<TaxEstimate[]>([]);
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([]);
  const [payments, setPayments] = useState<TaxPayment[]>([]);
  const [threshold, setThreshold] = useState<IncomeThreshold | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = taxYear || new Date().getFullYear();

  const fetchTaxData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch tax summary
      const summaryRes = await api.get<ApiResponse<TaxSummary>>('/tax/summary', {
        params: { tax_year: year },
      });
      setSummary(summaryRes.data.data || null);

      // Fetch deadlines
      const deadlinesRes = await api.get<ApiResponse<TaxDeadline[]>>('/tax/deadlines', {
        params: { tax_year: year },
      });
      const deadlinesData = deadlinesRes.data?.data;
      setDeadlines(Array.isArray(deadlinesData) ? deadlinesData : []);

      // Fetch payments
      const paymentsRes = await api.get<ApiResponse<TaxPayment[]>>('/tax/payments', {
        params: { tax_year: year },
      });
      const paymentsData = paymentsRes.data?.data;
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);

      // Fetch threshold status
      const thresholdRes = await api.get<ApiResponse<IncomeThreshold>>('/tax/threshold', {
        params: { tax_year: year },
      });
      setThreshold(thresholdRes.data.data || null);

      // Fetch saved estimates
      const estimatesRes = await api.get<ApiResponse<TaxEstimate[]>>('/tax/saved-estimates', {
        params: { tax_year: year },
      });
      const estimatesData = estimatesRes.data?.data;
      setEstimates(Array.isArray(estimatesData) ? estimatesData : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchTaxData();
  }, [fetchTaxData]);

  const recordPayment = useCallback(async (data: RecordPaymentInput): Promise<TaxPayment> => {
    try {
      const response = await api.post<ApiResponse<TaxPayment>>('/tax/payments', data);
      if (response.data.data) {
        setPayments((prev) => [response.data.data!, ...prev]);
        return response.data.data;
      }
      throw new Error('Failed to record payment');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, []);

  return {
    summary,
    estimates,
    deadlines,
    payments,
    threshold,
    isLoading,
    error,
    recordPayment,
    refresh: fetchTaxData,
  };
}
