'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CalculatorIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { TaxDisclaimer, TaxDisclaimerTooltip } from '@/components/ui/Disclaimer';

export default function DashboardPage() {
  const { summary, taxSummary, isLoading, error } = useDashboard();

  if (isLoading) {
    return <PageLoader />;
  }

  const currentQuarter = summary?.currentQuarter || Math.ceil((new Date().getMonth() + 1) / 3);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Q{currentQuarter} {new Date().getFullYear()} Overview
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/transactions?review_required=true"
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ExclamationTriangleIcon className="w-4 h-4 mr-2 text-warning-500" />
            Review Transactions
            {summary?.transactionsNeedingReview ? (
              <Badge variant="warning" size="sm" className="ml-2">
                {summary.transactionsNeedingReview}
              </Badge>
            ) : null}
          </Link>
          <Link
            href="/reports"
            className="inline-flex items-center px-4 py-2 bg-primary-600 rounded-lg text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4 mr-2" />
            Generate Report
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Income YTD */}
        <Card variant="stat">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-success-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-success-600" />
            </div>
            <Badge variant="success" size="sm">YTD</Badge>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(summary?.totalIncomeYTD || 0)}
            </p>
          </div>
        </Card>

        {/* Expenses YTD */}
        <Card variant="stat">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-danger-100 rounded-lg">
              <ArrowTrendingDownIcon className="w-6 h-6 text-danger-600" />
            </div>
            <Badge variant="danger" size="sm">YTD</Badge>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Total Deductions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(summary?.totalDeductionsYTD || 0)}
            </p>
          </div>
        </Card>

        {/* Net Profit */}
        <Card variant="stat">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BanknotesIcon className="w-6 h-6 text-primary-600" />
            </div>
            <Badge variant="info" size="sm">YTD</Badge>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Net Profit</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(summary?.netProfitYTD || 0)}
            </p>
          </div>
        </Card>

        {/* Estimated Tax */}
        <Card variant="stat">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-warning-100 rounded-lg">
              <CalculatorIcon className="w-6 h-6 text-warning-600" />
            </div>
            <Badge variant="warning" size="sm">Q{currentQuarter}</Badge>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
              Est. Quarterly Tax <TaxDisclaimerTooltip />
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(summary?.estimatedQuarterlyTax || 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Deadline Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Tax Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.nextDeadline ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-warning-50 rounded-lg border border-warning-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-warning-100 rounded-full">
                    <ClockIcon className="w-8 h-8 text-warning-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Q{summary.nextDeadline.quarter} Estimated Tax Payment
                    </p>
                    <p className="text-sm text-gray-600">
                      Due: {formatDate(summary.nextDeadline.due_date, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-3xl font-bold text-warning-700">
                    {summary.daysUntilDeadline !== null
                      ? summary.daysUntilDeadline
                      : daysUntil(summary.nextDeadline.due_date)}
                  </p>
                  <p className="text-sm text-warning-600">days remaining</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No upcoming deadlines</p>
              </div>
            )}

            {/* Quarterly Summary */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((quarter) => {
                const quarterData = taxSummary?.quarterly?.find(q => q.quarter === quarter);
                const isPast = quarter < currentQuarter;
                const isCurrent = quarter === currentQuarter;

                return (
                  <div
                    key={quarter}
                    className={`p-4 rounded-lg border ${
                      isCurrent
                        ? 'bg-primary-50 border-primary-200'
                        : isPast
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Q{quarter}</span>
                      {quarterData?.isPaid && (
                        <Badge variant="success" size="sm">Paid</Badge>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(quarterData?.estimatedPayment || 0)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <TaxDisclaimer variant="block" className="mt-4" />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/expenses?action=expense"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Add Expense</span>
              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/expenses?action=mileage"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Log Mileage</span>
              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/accounts"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Connect Account</span>
              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/tax?action=payment"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Record Payment</span>
              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* IRS Threshold Card */}
      <Card>
        <CardHeader>
          <CardTitle>IRS $5,000 Threshold Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">1099-K Reportable Income</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(taxSummary?.thresholdStatus?.total1099Income || 0)} / $5,000
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  (taxSummary?.thresholdStatus?.percentToThreshold || 0) >= 100
                    ? 'bg-danger-500'
                    : (taxSummary?.thresholdStatus?.percentToThreshold || 0) >= 80
                    ? 'bg-warning-500'
                    : 'bg-success-500'
                }`}
                style={{
                  width: `${Math.min(taxSummary?.thresholdStatus?.percentToThreshold || 0, 100)}%`,
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              {taxSummary?.thresholdStatus?.thresholdReached ? (
                <>
                  <ExclamationTriangleIcon className="w-5 h-5 text-danger-500" />
                  <span className="text-sm text-danger-700">
                    Threshold reached - You will receive 1099-K forms
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">
                  {(100 - (taxSummary?.thresholdStatus?.percentToThreshold || 0)).toFixed(0)}% remaining until IRS reporting threshold
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
