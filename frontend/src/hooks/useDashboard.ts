import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import type { DashboardSummary, TaxSummary, ApiResponse } from '@/types';

interface UseDashboardReturn {
  summary: DashboardSummary | null;
  taxSummary: TaxSummary | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch tax summary which includes most dashboard data
      const taxResponse = await api.get<ApiResponse<TaxSummary>>('/tax/summary');
      setTaxSummary(taxResponse.data.data || null);

      // Build dashboard summary from tax data
      if (taxResponse.data.data) {
        const tax = taxResponse.data.data;
        setSummary({
          totalIncomeYTD: tax.ytd?.totalIncome || 0,
          incomeByPlatform: {},
          totalDeductionsYTD: tax.ytd?.totalDeductions || 0,
          deductionsByCategory: {},
          netProfitYTD: tax.ytd?.netProfit || 0,
          estimatedQuarterlyTax: (Array.isArray(tax.quarterly) ? tax.quarterly : []).find(q => q.quarter === tax.currentQuarter)?.estimatedPayment || 0,
          estimatedYearlyTax: tax.ytd?.totalTaxOwed || 0,
          currentQuarter: tax.currentQuarter,
          nextDeadline: tax.nextDeadline || null,
          daysUntilDeadline: tax.daysUntilDeadline,
          transactionsNeedingReview: tax.transactionsNeedingReview || 0,
          connectedAccounts: tax.connectedAccounts || 0,
        });
      }
    } catch (err) {
      setError(getErrorMessage(err));
      // Set mock data for demo purposes when API fails
      setSummary({
        totalIncomeYTD: 0,
        incomeByPlatform: {},
        totalDeductionsYTD: 0,
        deductionsByCategory: {},
        netProfitYTD: 0,
        estimatedQuarterlyTax: 0,
        estimatedYearlyTax: 0,
        currentQuarter: Math.ceil((new Date().getMonth() + 1) / 3),
        nextDeadline: null,
        daysUntilDeadline: null,
        transactionsNeedingReview: 0,
        connectedAccounts: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    summary,
    taxSummary,
    isLoading,
    error,
    refresh: fetchDashboard,
  };
}
