'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTax } from '@/hooks/useTax';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { formatCurrency, formatDate, formatDateInput, getCurrentQuarter } from '@/lib/utils';
import {
  CalculatorIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { TaxDisclaimer, TaxDisclaimerTooltip } from '@/components/ui/Disclaimer';

interface PaymentFormData {
  quarter: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  confirmation_number?: string;
  notes?: string;
}

export default function TaxPage() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { summary, deadlines, payments, threshold, isLoading, recordPayment, refresh } = useTax(selectedYear);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Open modal based on URL action parameter
  useEffect(() => {
    if (action === 'payment') {
      setShowPaymentModal(true);
    }
  }, [action]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentForm = useForm<PaymentFormData>({
    defaultValues: {
      quarter: String(getCurrentQuarter()),
      payment_date: formatDateInput(new Date()),
      payment_method: 'irs_direct_pay',
    },
  });

  const handleRecordPayment = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      await recordPayment({
        tax_year: selectedYear,
        quarter: parseInt(data.quarter),
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        confirmation_number: data.confirmation_number,
        notes: data.notes,
      });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      paymentForm.reset();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quarterOptions = [
    { value: '1', label: 'Q1 (Jan - Mar)' },
    { value: '2', label: 'Q2 (Apr - Jun)' },
    { value: '3', label: 'Q3 (Jul - Sep)' },
    { value: '4', label: 'Q4 (Oct - Dec)' },
  ];

  const paymentMethodOptions = [
    { value: 'irs_direct_pay', label: 'IRS Direct Pay' },
    { value: 'eftps', label: 'EFTPS' },
    { value: 'check', label: 'Check' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'other', label: 'Other' },
  ];

  const yearOptions = [
    { value: String(currentYear), label: String(currentYear) },
    { value: String(currentYear - 1), label: String(currentYear - 1) },
    { value: String(currentYear - 2), label: String(currentYear - 2) },
  ];

  if (isLoading) {
    return <PageLoader />;
  }

  const currentQuarter = getCurrentQuarter();
  const ytd = summary?.ytd || {
    totalIncome: 0,
    totalDeductions: 0,
    netProfit: 0,
    selfEmploymentTax: 0,
    incomeTax: 0,
    totalTaxOwed: 0,
  };

  const totalPayments = (payments || []).reduce((sum, p) => sum + p.amount, 0);
  const remainingTax = Math.max(0, ytd.totalTaxOwed - totalPayments);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Estimates</h1>
          <p className="text-gray-500 mt-1">
            Quarterly tax estimates and payment tracking
          </p>
        </div>

        <div className="flex gap-3">
          <Select
            options={yearOptions}
            value={String(selectedYear)}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-32"
          />
          <Button onClick={() => setShowPaymentModal(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* YTD Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Profit YTD</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(ytd.netProfit)}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning-100 rounded-lg">
              <CalculatorIcon className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                Estimated Tax <TaxDisclaimerTooltip />
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(ytd.totalTaxOwed)}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <BanknotesIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Payments Made</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalPayments)}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-danger-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-danger-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(remainingTax)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tax Estimate Disclaimer */}
      <TaxDisclaimer variant="block" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quarterly Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quarterly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((quarter) => {
                const deadline = (deadlines || []).find((d) => d.quarter === quarter);
                const quarterPayments = (payments || []).filter((p) => p.quarter === quarter);
                const quarterPaid = quarterPayments.reduce((sum, p) => sum + p.amount, 0);
                const quarterData = summary?.quarterly?.find((q) => q.quarter === quarter);
                const estimatedPayment = quarterData?.estimatedPayment || 0;
                const isPast = quarter < currentQuarter;
                const isCurrent = quarter === currentQuarter;
                const isPaid = quarterData?.isPaid || quarterPaid >= estimatedPayment;

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
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isPaid
                              ? 'bg-success-100'
                              : isCurrent
                              ? 'bg-warning-100'
                              : 'bg-gray-100'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircleIcon className="w-5 h-5 text-success-600" />
                          ) : (
                            <span className="text-sm font-bold text-gray-600">Q{quarter}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Quarter {quarter}</p>
                          {deadline && (
                            <p className="text-sm text-gray-500">
                              Due: {formatDate(deadline.due_date)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 flex items-center justify-end gap-1">
                          {formatCurrency(estimatedPayment)}
                          <TaxDisclaimerTooltip />
                        </p>
                        {isPaid ? (
                          <Badge variant="success" size="sm">Paid</Badge>
                        ) : isCurrent ? (
                          <Badge variant="warning" size="sm">Due Soon</Badge>
                        ) : isPast ? (
                          <Badge variant="danger" size="sm">Overdue</Badge>
                        ) : (
                          <Badge size="sm">Upcoming</Badge>
                        )}
                      </div>
                    </div>

                    {quarterPaid > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Paid</span>
                          <span className="font-medium text-success-600">
                            {formatCurrency(quarterPaid)}
                          </span>
                        </div>
                        {estimatedPayment > quarterPaid && (
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-500">Remaining</span>
                            <span className="font-medium text-danger-600">
                              {formatCurrency(estimatedPayment - quarterPaid)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Tax Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tax Breakdown</CardTitle>
                <TaxDisclaimerTooltip />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Gross Income</span>
                <span className="font-medium">{formatCurrency(ytd.totalIncome || 0)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Deductions</span>
                <span className="font-medium text-success-600">
                  -{formatCurrency(ytd.totalDeductions || 0)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t">
                <span className="text-gray-600">Net Profit</span>
                <span className="font-medium">{formatCurrency(ytd.netProfit)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Self-Employment Tax</span>
                <span className="font-medium">{formatCurrency(ytd.selfEmploymentTax)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Income Tax</span>
                <span className="font-medium">{formatCurrency(ytd.incomeTax)}</span>
              </div>
              <div className="flex justify-between py-2 border-t font-semibold">
                <span className="text-gray-900">Total Tax Owed</span>
                <span className="text-gray-900">{formatCurrency(ytd.totalTaxOwed)}</span>
              </div>
            </CardContent>
          </Card>

          {/* IRS Threshold */}
          <Card>
            <CardHeader>
              <CardTitle>IRS $5,000 Threshold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">1099-K Income</span>
                  <span className="font-medium">
                    {formatCurrency(threshold?.total_1099_income || 0)}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      threshold?.threshold_5000_reached
                        ? 'bg-danger-500'
                        : (threshold?.total_1099_income || 0) >= 4000
                        ? 'bg-warning-500'
                        : 'bg-success-500'
                    }`}
                    style={{
                      width: `${Math.min(((threshold?.total_1099_income || 0) / 5000) * 100, 100)}%`,
                    }}
                  />
                </div>

                <p className="text-sm text-gray-500">
                  {threshold?.threshold_5000_reached
                    ? 'You will receive 1099-K forms from payment platforms'
                    : `${formatCurrency(5000 - (threshold?.total_1099_income || 0))} remaining until threshold`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {(!payments || payments.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <BanknotesIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No payments recorded yet</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setShowPaymentModal(true)}
              >
                Record Your First Payment
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {(payments || []).map((payment) => (
                <div key={payment.payment_id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-5 h-5 text-success-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Q{payment.quarter} {payment.tax_year} Payment
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(payment.payment_date)} via {payment.payment_method.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success-600">
                      {formatCurrency(payment.amount)}
                    </p>
                    {payment.confirmation_number && (
                      <p className="text-xs text-gray-500">
                        #{payment.confirmation_number}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Tax Payment"
        size="lg"
      >
        <form onSubmit={paymentForm.handleSubmit(handleRecordPayment)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Quarter"
              options={quarterOptions}
              {...paymentForm.register('quarter', { required: true })}
            />
            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...paymentForm.register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be positive' },
                valueAsNumber: true,
              })}
              error={paymentForm.formState.errors.amount?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Payment Date"
              type="date"
              {...paymentForm.register('payment_date', { required: true })}
            />
            <Select
              label="Payment Method"
              options={paymentMethodOptions}
              {...paymentForm.register('payment_method', { required: true })}
            />
          </div>

          <Input
            label="Confirmation Number (optional)"
            placeholder="e.g., 123456789"
            {...paymentForm.register('confirmation_number')}
          />

          <Input
            label="Notes (optional)"
            placeholder="Additional details..."
            {...paymentForm.register('notes')}
          />

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
