'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useReports } from '@/hooks/useReports';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, getCurrentQuarter } from '@/lib/utils';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface EmailFormData {
  email: string;
}

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const { reports, preview, isLoading, isGenerating, fetchPreview, generateReport, emailReport } = useReports();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>(getCurrentQuarter());
  const [showEmailModal, setShowEmailModal] = useState(false);

  const emailForm = useForm<EmailFormData>();

  useEffect(() => {
    fetchPreview(selectedYear, selectedQuarter).catch(() => {
      // Silently fail - preview is optional
    });
  }, [selectedYear, selectedQuarter, fetchPreview]);

  const handleGenerate = async () => {
    try {
      await generateReport(selectedYear, selectedQuarter);
      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    }
  };

  const handleEmail = async (data: EmailFormData) => {
    try {
      await emailReport(selectedYear, selectedQuarter, data.email);
      toast.success('Report sent to ' + data.email);
      setShowEmailModal(false);
      emailForm.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to email report');
    }
  };

  const yearOptions = [
    { value: String(currentYear), label: String(currentYear) },
    { value: String(currentYear - 1), label: String(currentYear - 1) },
    { value: String(currentYear - 2), label: String(currentYear - 2) },
  ];

  const quarterOptions = [
    { value: '', label: 'Annual Report' },
    { value: '1', label: 'Q1 (Jan - Mar)' },
    { value: '2', label: 'Q2 (Apr - Jun)' },
    { value: '3', label: 'Q3 (Jul - Sep)' },
    { value: '4', label: 'Q4 (Oct - Dec)' },
  ];

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">
            Generate and download tax reports
          </p>
        </div>
      </div>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Options */}
            <div className="space-y-4">
              <Select
                label="Tax Year"
                options={yearOptions}
                value={String(selectedYear)}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              />
              <Select
                label="Period"
                options={quarterOptions}
                value={selectedQuarter ? String(selectedQuarter) : ''}
                onChange={(e) => setSelectedQuarter(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            {/* Preview */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedQuarter ? `Q${selectedQuarter} ${selectedYear}` : `${selectedYear} Annual`} Report Preview
                </h3>

                {preview ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Income</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(preview.summary?.totalIncome || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Deductions</p>
                        <p className="text-xl font-bold text-success-600">
                          {formatCurrency(preview.summary?.totalDeductions || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Net Profit</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(preview.summary?.netProfit || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estimated Tax</p>
                        <p className="text-xl font-bold text-warning-600">
                          {formatCurrency(preview.summary?.estimatedTax || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">Period</p>
                      <p className="text-gray-900">
                        {preview.periodStart && preview.periodEnd
                          ? `${formatDate(preview.periodStart)} - ${formatDate(preview.periodEnd)}`
                          : 'Full Year'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>Select options to preview report</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              className="flex-1 sm:flex-none"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowEmailModal(true)}
              className="flex-1 sm:flex-none"
            >
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Email to Accountant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Contents Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Report Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Income Summary</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full" />
                  Total gross income by platform
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full" />
                  Monthly income breakdown
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full" />
                  1099-K threshold status
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Expense Summary</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full" />
                  Expenses by Schedule C category
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full" />
                  Mileage deduction summary
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full" />
                  Home office deduction (if applicable)
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Tax Calculations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning-500 rounded-full" />
                  Self-employment tax estimate
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning-500 rounded-full" />
                  Income tax estimate
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning-500 rounded-full" />
                  Quarterly payment schedule
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Payment History</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-danger-500 rounded-full" />
                  Estimated payments made
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-danger-500 rounded-full" />
                  Remaining balance owed
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-danger-500 rounded-full" />
                  Payment confirmation numbers
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {(!reports || reports.length === 0) ? (
            <EmptyState
              icon={<DocumentDuplicateIcon className="w-12 h-12" />}
              title="No reports generated yet"
              description="Generate your first report to start tracking your tax documents."
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {(reports || []).slice(0, 10).map((report) => (
                <div
                  key={report.report_id}
                  className="py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {report.quarter
                          ? `Q${report.quarter} ${report.tax_year}`
                          : `${report.tax_year} Annual`}{' '}
                        Report
                      </p>
                      <p className="text-sm text-gray-500">
                        Generated {formatDate(report.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.report_type === 'annual' ? 'info' : 'default'}>
                      {report.report_type === 'annual' ? 'Annual' : 'Quarterly'}
                    </Badge>
                    {report.file_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(report.file_url!, '_blank')}
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Email Report"
      >
        <form onSubmit={emailForm.handleSubmit(handleEmail)} className="space-y-4">
          <p className="text-sm text-gray-600">
            Send the {selectedQuarter ? `Q${selectedQuarter}` : 'annual'} {selectedYear} report
            to your accountant or tax professional.
          </p>

          <Input
            label="Email Address"
            type="email"
            placeholder="accountant@example.com"
            {...emailForm.register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            error={emailForm.formState.errors.email?.message}
          />

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowEmailModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isGenerating}>
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Send Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
