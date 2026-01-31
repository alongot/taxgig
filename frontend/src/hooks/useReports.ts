import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import type { Report, ReportPreview, ApiResponse } from '@/types';

interface UseReportsReturn {
  reports: Report[];
  preview: ReportPreview | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  fetchPreview: (year: number, quarter?: number) => Promise<void>;
  generateReport: (year: number, quarter?: number) => Promise<void>;
  emailReport: (year: number, quarter?: number, email?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReports(): UseReportsReturn {
  const [reports, setReports] = useState<Report[]>([]);
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<ApiResponse<Report[]>>('/reports/history');
      const data = response.data?.data;
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const fetchPreview = useCallback(async (year: number, quarter?: number) => {
    try {
      const params: Record<string, string | number> = { year };
      if (quarter) params.quarter = quarter;

      const response = await api.get<ApiResponse<ReportPreview>>('/reports/preview', { params });
      setPreview(response.data.data || null);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, []);

  const generateReport = useCallback(async (year: number, quarter?: number) => {
    setIsGenerating(true);
    try {
      const params: Record<string, string | number> = { year };
      if (quarter) params.quarter = quarter;

      // This will trigger a file download
      const response = await api.get('/reports/generate', {
        params,
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tax-report-${year}${quarter ? `-Q${quarter}` : ''}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Refresh report history
      await fetchReports();
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }, [fetchReports]);

  const emailReport = useCallback(async (year: number, quarter?: number, email?: string) => {
    setIsGenerating(true);
    try {
      await api.post('/reports/email', {
        tax_year: year,
        quarter,
        recipient_email: email,
      });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    reports,
    preview,
    isLoading,
    isGenerating,
    error,
    fetchPreview,
    generateReport,
    emailReport,
    refresh: fetchReports,
  };
}
