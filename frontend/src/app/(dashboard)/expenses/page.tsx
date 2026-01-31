'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useExpenses, UnifiedExpense } from '@/hooks/useExpenses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, formatDateInput } from '@/lib/utils';
import type { CreateExpenseInput, CreateMileageInput, ManualExpense } from '@/types';
import {
  PlusIcon,
  BanknotesIcon,
  TruckIcon,
  TrashIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  CloudArrowDownIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

type ModalType = 'expense' | 'mileage' | 'invoice' | null;

interface InvoiceFormData {
  client_name: string;
  client_email: string;
  due_date: string;
  notes: string;
}

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const {
    expenses,
    allExpenses,
    syncedExpenses,
    categories,
    mileageRate,
    isLoading,
    pagination,
    filters,
    setFilters,
    createExpense,
    createMileageExpense,
    deleteExpense,
    refresh,
  } = useExpenses();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedExpense, setSelectedExpense] = useState<UnifiedExpense | null>(null);

  // Open modal based on URL action parameter
  useEffect(() => {
    if (action === 'expense') {
      setModalType('expense');
    } else if (action === 'mileage') {
      setModalType('mileage');
    }
  }, [action]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ManualExpense | null>(null);

  const expenseForm = useForm<CreateExpenseInput>({
    defaultValues: {
      expense_date: formatDateInput(new Date()),
      is_business: true,
      business_percentage: 100,
    },
  });

  const mileageForm = useForm<CreateMileageInput>({
    defaultValues: {
      expense_date: formatDateInput(new Date()),
    },
  });

  const invoiceForm = useForm<InvoiceFormData>({
    defaultValues: {
      due_date: formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
    },
  });

  const handleCreateExpense = async (data: CreateExpenseInput) => {
    setIsSubmitting(true);
    try {
      await createExpense(data);
      toast.success('Expense added successfully');
      setModalType(null);
      expenseForm.reset({
        expense_date: formatDateInput(new Date()),
        is_business: true,
        business_percentage: 100,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMileage = async (data: CreateMileageInput) => {
    setIsSubmitting(true);
    try {
      await createMileageExpense(data);
      toast.success('Mileage logged successfully');
      setModalType(null);
      mileageForm.reset({
        expense_date: formatDateInput(new Date()),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log mileage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteExpense(expenseToDelete.manual_expense_id);
      toast.success('Expense deleted');
      setExpenseToDelete(null);
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  const handleSendInvoice = async (data: InvoiceFormData) => {
    if (!selectedExpense) return;
    setIsSubmitting(true);
    try {
      // In a real app, this would call an API to generate and send the invoice
      toast.success(`Invoice sent to ${data.client_email}`);
      setModalType(null);
      setSelectedExpense(null);
      invoiceForm.reset();
    } catch (err) {
      toast.error('Failed to send invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openInvoiceModal = (expense: UnifiedExpense) => {
    setSelectedExpense(expense);
    setModalType('invoice');
  };

  const categoryOptions = (categories || []).map((c) => ({
    value: c.category_name,
    label: c.category_name,
  }));

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'check', label: 'Check' },
    { value: 'venmo', label: 'Venmo' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'other', label: 'Other' },
  ];

  // Calculate stats from all expenses
  const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalMiles = allExpenses
    .filter((e) => e.is_mileage)
    .reduce((sum, e) => sum + (e.miles || 0), 0);
  const mileageDeduction = allExpenses
    .filter((e) => e.is_mileage)
    .reduce((sum, e) => sum + e.amount, 0);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 mt-1">
            Track your business expenses and mileage
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setModalType('mileage')}>
            <TruckIcon className="w-4 h-4 mr-2" />
            Log Mileage
          </Button>
          <Button onClick={() => setModalType('expense')}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <BanknotesIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <TruckIcon className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Miles</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalMiles.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning-100 rounded-lg">
              <span className="text-lg font-bold text-warning-600">$</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mileage Deduction</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(mileageDeduction)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilters({ ...filters, source: undefined, is_mileage: undefined, page: 1 })}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filters.source === undefined && filters.is_mileage === undefined
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All ({allExpenses.length})
        </button>
        <button
          onClick={() => setFilters({ ...filters, source: 'synced', is_mileage: undefined, page: 1 })}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filters.source === 'synced'
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CloudArrowDownIcon className="w-4 h-4 inline mr-1" />
          Synced ({syncedExpenses.length})
        </button>
        <button
          onClick={() => setFilters({ ...filters, source: 'manual', is_mileage: false, page: 1 })}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filters.source === 'manual' && filters.is_mileage === false
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Manual Expenses
        </button>
        <button
          onClick={() => setFilters({ ...filters, source: 'manual', is_mileage: true, page: 1 })}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filters.is_mileage === true
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Mileage
        </button>
      </div>

      {/* Expenses List */}
      <Card>
        <CardContent className="p-0">
          {allExpenses.length === 0 ? (
            <EmptyState
              icon={<BanknotesIcon className="w-12 h-12" />}
              title="No expenses yet"
              description="Start tracking your business expenses to maximize your deductions."
              action={{
                label: 'Add Expense',
                onClick: () => setModalType('expense'),
              }}
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {allExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          expense.is_mileage
                            ? 'bg-success-100'
                            : expense.source === 'synced'
                            ? 'bg-blue-100'
                            : 'bg-primary-100'
                        }`}
                      >
                        {expense.is_mileage ? (
                          <TruckIcon className="w-5 h-5 text-success-600" />
                        ) : expense.source === 'synced' ? (
                          <LinkIcon className="w-5 h-5 text-blue-600" />
                        ) : (
                          <BanknotesIcon className="w-5 h-5 text-primary-600" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {expense.is_mileage
                            ? `${expense.miles} miles`
                            : expense.merchant}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(expense.date)}
                          <span className="ml-2 text-gray-400">
                            {expense.category_name}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </p>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          {expense.source === 'synced' && (
                            <Badge variant="info" size="sm">Synced</Badge>
                          )}
                          {expense.is_mileage && (
                            <Badge variant="success" size="sm">Mileage</Badge>
                          )}
                          {expense.is_business && !expense.is_mileage && (
                            <Badge variant="default" size="sm">Business</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Invoice button */}
                        <button
                          onClick={() => openInvoiceModal(expense)}
                          className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                          title="Send Invoice"
                        >
                          <DocumentTextIcon className="w-5 h-5" />
                        </button>
                        {/* Delete button (only for manual expenses) */}
                        {expense.source === 'manual' && expense.manual_expense && (
                          <button
                            onClick={() => setExpenseToDelete(expense.manual_expense!)}
                            className="p-2 text-gray-400 hover:text-danger-500 transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((pagination?.page || 1) - 1) * (pagination?.limit || 20) + 1} to{' '}
            {Math.min((pagination?.page || 1) * (pagination?.limit || 20), pagination?.total || 0)} of{' '}
            {pagination?.total || 0}
          </p>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={(pagination?.page || 1) === 1}
              onClick={() => setFilters({ ...filters, page: (pagination?.page || 1) - 1 })}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {pagination?.page || 1} of {pagination?.totalPages || 1}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={(pagination?.page || 1) === (pagination?.totalPages || 1)}
              onClick={() => setFilters({ ...filters, page: (pagination?.page || 1) + 1 })}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={modalType === 'expense'}
        onClose={() => setModalType(null)}
        title="Add Expense"
        size="lg"
      >
        <form onSubmit={expenseForm.handleSubmit(handleCreateExpense)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              {...expenseForm.register('expense_date', { required: 'Date is required' })}
              error={expenseForm.formState.errors.expense_date?.message}
            />
            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...expenseForm.register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be positive' },
                valueAsNumber: true,
              })}
              error={expenseForm.formState.errors.amount?.message}
            />
          </div>

          <Input
            label="Merchant / Vendor"
            placeholder="e.g., Office Depot"
            {...expenseForm.register('merchant', { required: 'Merchant is required' })}
            error={expenseForm.formState.errors.merchant?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categoryOptions}
              placeholder="Select category"
              {...expenseForm.register('category_name', { required: 'Category is required' })}
              error={expenseForm.formState.errors.category_name?.message}
            />
            <Select
              label="Payment Method"
              options={paymentMethodOptions}
              placeholder="Select method"
              {...expenseForm.register('payment_method')}
            />
          </div>

          <Input
            label="Notes (optional)"
            placeholder="Additional details..."
            {...expenseForm.register('notes')}
          />

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...expenseForm.register('is_business')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Business expense</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setModalType(null)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              Add Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Mileage Modal */}
      <Modal
        isOpen={modalType === 'mileage'}
        onClose={() => setModalType(null)}
        title="Log Mileage"
        size="lg"
      >
        <form onSubmit={mileageForm.handleSubmit(handleCreateMileage)} className="space-y-4">
          <div className="p-4 bg-success-50 rounded-lg border border-success-200 mb-4">
            <p className="text-sm text-success-700">
              Current IRS mileage rate: <span className="font-semibold">${mileageRate}/mile</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              {...mileageForm.register('expense_date', { required: 'Date is required' })}
              error={mileageForm.formState.errors.expense_date?.message}
            />
            <Input
              label="Miles Driven"
              type="number"
              step="0.1"
              placeholder="0.0"
              {...mileageForm.register('miles', {
                required: 'Miles is required',
                min: { value: 0.1, message: 'Miles must be positive' },
                valueAsNumber: true,
              })}
              error={mileageForm.formState.errors.miles?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Location (optional)"
              placeholder="e.g., Home"
              {...mileageForm.register('start_location')}
            />
            <Input
              label="End Location (optional)"
              placeholder="e.g., Client Office"
              {...mileageForm.register('end_location')}
            />
          </div>

          <Input
            label="Notes (optional)"
            placeholder="Purpose of trip..."
            {...mileageForm.register('notes')}
          />

          {mileageForm.watch('miles') > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Estimated deduction:</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency((mileageForm.watch('miles') || 0) * mileageRate)}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setModalType(null)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              Log Mileage
            </Button>
          </div>
        </form>
      </Modal>

      {/* Send Invoice Modal */}
      <Modal
        isOpen={modalType === 'invoice'}
        onClose={() => {
          setModalType(null);
          setSelectedExpense(null);
        }}
        title="Send Invoice"
        size="lg"
      >
        {selectedExpense && (
          <form onSubmit={invoiceForm.handleSubmit(handleSendInvoice)} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <p className="text-sm text-gray-600">Invoice for:</p>
              <p className="font-semibold text-gray-900">{selectedExpense.merchant}</p>
              <p className="text-lg font-bold text-primary-600 mt-1">
                {formatCurrency(selectedExpense.amount)}
              </p>
              <p className="text-sm text-gray-500">{formatDate(selectedExpense.date)}</p>
            </div>

            <Input
              label="Client Name"
              placeholder="e.g., John Smith"
              {...invoiceForm.register('client_name', { required: 'Client name is required' })}
              error={invoiceForm.formState.errors.client_name?.message}
            />

            <Input
              label="Client Email"
              type="email"
              placeholder="client@example.com"
              {...invoiceForm.register('client_email', {
                required: 'Client email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              error={invoiceForm.formState.errors.client_email?.message}
            />

            <Input
              label="Due Date"
              type="date"
              {...invoiceForm.register('due_date', { required: 'Due date is required' })}
              error={invoiceForm.formState.errors.due_date?.message}
            />

            <Input
              label="Notes (optional)"
              placeholder="Additional invoice notes..."
              {...invoiceForm.register('notes')}
            />

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setModalType(null);
                  setSelectedExpense(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Send Invoice
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        title="Delete Expense"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setExpenseToDelete(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
