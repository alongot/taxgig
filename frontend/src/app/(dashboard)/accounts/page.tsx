'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink, PlaidLinkOnSuccessMetadata } from 'react-plaid-link';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import type { Account, ApiResponse } from '@/types';
import {
  BuildingLibraryIcon,
  PlusIcon,
  ArrowPathIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<Account | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      // Backend returns AccountSummary with accounts array inside
      const response = await api.get<ApiResponse<{ accounts: Account[] }>>('/accounts');
      const accountsData = response.data?.data?.accounts;
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Get link token when user wants to connect
  const initializePlaidLink = async () => {
    setIsConnecting(true);
    try {
      const response = await api.post<ApiResponse<{ link_token: string }>>('/accounts/link-token');
      const token = response.data?.data?.link_token;

      if (!token) {
        toast.error('Failed to initialize account connection');
        setIsConnecting(false);
        return;
      }

      setLinkToken(token);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsConnecting(false);
    }
  };

  // Handle successful Plaid Link connection
  const onPlaidSuccess = useCallback(async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
    try {
      // Exchange public token for access token on backend
      await api.post('/accounts/connect', {
        public_token: publicToken,
        account_ids: metadata.accounts?.map(a => a.id),
        metadata: {
          institution: metadata.institution ? {
            name: metadata.institution.name,
            institution_id: metadata.institution.institution_id,
          } : undefined,
          accounts: metadata.accounts,
        },
      });

      toast.success('Account connected successfully!');
      await fetchAccounts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLinkToken(null);
      setIsConnecting(false);
    }
  }, [fetchAccounts]);

  const onPlaidExit = useCallback(() => {
    setLinkToken(null);
    setIsConnecting(false);
  }, []);

  // Plaid Link hook
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onPlaidExit,
  });

  // Open Plaid Link when token is ready
  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await api.post('/accounts/sync-all');
      toast.success('All accounts synced successfully');
      await fetchAccounts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      await api.post(`/accounts/${accountId}/sync`);
      toast.success('Account synced successfully');
      await fetchAccounts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDisconnect = async () => {
    if (!accountToDisconnect) return;
    try {
      await api.post(`/accounts/${accountToDisconnect.account_id}/disconnect`);
      toast.success('Account disconnected');
      setAccountToDisconnect(null);
      await fetchAccounts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const getStatusBadge = (status: Account['connection_status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="success">Connected</Badge>;
      case 'disconnected':
        return <Badge>Disconnected</Badge>;
      case 'error':
        return <Badge variant="danger">Error</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: Account['connection_status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-success-600" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-danger-600" />;
      default:
        return <LinkIcon className="w-5 h-5 text-gray-400" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
          <p className="text-gray-500 mt-1">
            Manage your bank accounts and payment platforms
          </p>
        </div>

        <div className="flex gap-3">
          {accounts && accounts.length > 0 && (
            <Button variant="secondary" onClick={handleSyncAll} isLoading={isSyncing}>
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Sync All
            </Button>
          )}
          <Button onClick={initializePlaidLink} isLoading={isConnecting}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Connect Account
          </Button>
        </div>
      </div>

      {/* Accounts List */}
      <Card>
        <CardContent className="p-0">
          {(!accounts || accounts.length === 0) ? (
            <EmptyState
              icon={<BuildingLibraryIcon className="w-12 h-12" />}
              title="No accounts connected"
              description="Connect your bank accounts to automatically import transactions and track your income."
              action={{
                label: 'Connect Account',
                onClick: initializePlaidLink,
              }}
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {(accounts || []).map((account) => (
                <div
                  key={account.account_id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        {getStatusIcon(account.connection_status)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {account.account_name}
                          </h3>
                          {getStatusBadge(account.connection_status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {account.institution_name || account.platform}
                          {account.account_mask && (
                            <span className="ml-2">****{account.account_mask}</span>
                          )}
                        </p>
                        {account.last_synced_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last synced: {formatDate(account.last_synced_at, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSyncAccount(account.account_id)}
                        title="Sync account"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAccountToDisconnect(account)}
                        className="text-danger-500 hover:text-danger-600"
                        title="Disconnect account"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BuildingLibraryIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Secure Bank Connection</h3>
              <p className="text-sm text-gray-500 mt-1">
                We use Plaid to securely connect to your bank accounts. Your credentials are never stored on our servers,
                and all connections are encrypted using bank-level security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={!!accountToDisconnect}
        onClose={() => setAccountToDisconnect(null)}
        title="Disconnect Account"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to disconnect{' '}
            <span className="font-medium">{accountToDisconnect?.account_name}</span>?
          </p>
          <p className="text-sm text-gray-500">
            Your transaction history will be preserved, but no new transactions will be imported.
          </p>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setAccountToDisconnect(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
