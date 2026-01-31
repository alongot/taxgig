'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction, TransactionType } from '@/types';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const reviewRequired = searchParams.get('review_required') === 'true';

  const {
    transactions,
    categories,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    updateTransaction,
    markAsReviewed,
    refresh,
  } = useTransactions({
    review_required: reviewRequired || undefined,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const transactionTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'refund', label: 'Refund' },
  ];

  const businessOptions = [
    { value: '', label: 'All' },
    { value: 'true', label: 'Business' },
    { value: 'false', label: 'Personal' },
  ];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFilters({ ...filters, search: formData.get('search') as string, page: 1 });
  };

  const handleReview = async () => {
    if (!selectedTransaction) return;
    setIsUpdating(true);
    try {
      await markAsReviewed(selectedTransaction.transaction_id);
      toast.success('Transaction reviewed');
      setSelectedTransaction(null);
    } catch (err) {
      toast.error('Failed to review transaction');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCategorize = async (categoryId: string, isBusiness: boolean) => {
    if (!selectedTransaction) return;
    setIsUpdating(true);
    try {
      await updateTransaction(selectedTransaction.transaction_id, {
        category_id: categoryId,
        is_business: isBusiness,
      });
      await markAsReviewed(selectedTransaction.transaction_id);
      toast.success('Transaction categorized and reviewed');
      setSelectedTransaction(null);
    } catch (err) {
      toast.error('Failed to categorize transaction');
    } finally {
      setIsUpdating(false);
    }
  };

  const getTransactionTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return <Badge variant="success">Income</Badge>;
      case 'expense':
        return <Badge variant="danger">Expense</Badge>;
      case 'transfer':
        return <Badge variant="info">Transfer</Badge>;
      case 'refund':
        return <Badge variant="warning">Refund</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">
            {pagination?.total || 0} transaction{(pagination?.total || 0) !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={refresh}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Sync
          </Button>
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search by merchant or description..."
                defaultValue={filters.search || ''}
                className="input pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
              <Select
                label="Transaction Type"
                options={transactionTypeOptions}
                value={filters.transaction_type || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    transaction_type: e.target.value as TransactionType | undefined,
                    page: 1,
                  })
                }
              />
              <Select
                label="Business/Personal"
                options={businessOptions}
                value={filters.is_business === undefined ? '' : String(filters.is_business)}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    is_business: e.target.value === '' ? undefined : e.target.value === 'true',
                    page: 1,
                  })
                }
              />
              <Input
                label="Start Date"
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value, page: 1 })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardContent className="p-0">
          {(!transactions || transactions.length === 0) ? (
            <EmptyState
              icon={<CreditCardIcon className="w-12 h-12" />}
              title="No transactions found"
              description="Connect a bank account or adjust your filters to see transactions."
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {(transactions || []).map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.transaction_type === 'income'
                            ? 'bg-success-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        <span
                          className={`text-lg font-semibold ${
                            transaction.transaction_type === 'income'
                              ? 'text-success-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {transaction.merchant_name?.[0] ||
                            transaction.description?.[0] ||
                            '?'}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {transaction.merchant_name || transaction.description || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.transaction_date)}
                          {transaction.category_name && (
                            <span className="ml-2 text-gray-400">
                              {transaction.category_name}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            transaction.transaction_type === 'income'
                              ? 'text-success-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {transaction.transaction_type === 'income' ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          {getTransactionTypeBadge(transaction.transaction_type)}
                          {transaction.is_business && (
                            <Badge variant="info" size="sm">
                              Business
                            </Badge>
                          )}
                        </div>
                      </div>

                      {transaction.review_required && (
                        <div className="w-3 h-3 bg-warning-500 rounded-full" title="Needs review" />
                      )}
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
            {Math.min((pagination?.page || 1) * (pagination?.limit || 20), pagination?.total || 0)} of {pagination?.total || 0}
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

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title="Transaction Details"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Merchant</p>
                <p className="font-medium">
                  {selectedTransaction.merchant_name || selectedTransaction.description || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(selectedTransaction.transaction_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium text-lg">
                  {formatCurrency(selectedTransaction.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                {getTransactionTypeBadge(selectedTransaction.transaction_type)}
              </div>
            </div>

            {selectedTransaction.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-900">{selectedTransaction.description}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Categorize as:</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {(categories || []).map((category) => (
                  <button
                    key={category.category_id}
                    onClick={() => handleCategorize(category.category_id, true)}
                    className="text-left p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{category.category_name}</p>
                    {category.deduction_rate < 1 && (
                      <p className="text-xs text-gray-500">
                        {(category.deduction_rate * 100).toFixed(0)}% deductible
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => handleCategorize('', false)}
                isLoading={isUpdating}
              >
                <XCircleIcon className="w-4 h-4 mr-2" />
                Mark Personal
              </Button>
              <Button className="flex-1" onClick={handleReview} isLoading={isUpdating}>
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Confirm & Review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
