'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PageLoader } from '@/components/ui/Spinner';
import type { User, TaxFilingStatus, NotificationPreferences, ApiResponse } from '@/types';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

interface ProfileFormData {
  full_name: string;
  tax_filing_status: TaxFilingStatus;
  marginal_tax_rate: number;
  w2_withholding_annual: number;
}

interface NotificationFormData {
  push_enabled: boolean;
  email_enabled: boolean;
  threshold_alerts: boolean;
  deadline_reminders: boolean;
  weekly_digest: boolean;
  transaction_review: boolean;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      full_name: user?.full_name || '',
      tax_filing_status: user?.tax_filing_status || 'single',
      marginal_tax_rate: user?.marginal_tax_rate || 22,
      w2_withholding_annual: user?.w2_withholding_annual || 0,
    },
  });

  const notificationForm = useForm<NotificationFormData>({
    defaultValues: {
      push_enabled: user?.notification_preferences?.push_enabled ?? true,
      email_enabled: user?.notification_preferences?.email_enabled ?? true,
      threshold_alerts: user?.notification_preferences?.threshold_alerts ?? true,
      deadline_reminders: user?.notification_preferences?.deadline_reminders ?? true,
      weekly_digest: user?.notification_preferences?.weekly_digest ?? false,
      transaction_review: user?.notification_preferences?.transaction_review ?? true,
    },
  });

  const passwordForm = useForm<PasswordFormData>();

  useEffect(() => {
    if (user) {
      profileForm.reset({
        full_name: user.full_name,
        tax_filing_status: user.tax_filing_status,
        marginal_tax_rate: user.marginal_tax_rate,
        w2_withholding_annual: user.w2_withholding_annual,
      });

      if (user.notification_preferences) {
        notificationForm.reset({
          push_enabled: user.notification_preferences.push_enabled,
          email_enabled: user.notification_preferences.email_enabled,
          threshold_alerts: user.notification_preferences.threshold_alerts,
          deadline_reminders: user.notification_preferences.deadline_reminders,
          weekly_digest: user.notification_preferences.weekly_digest,
          transaction_review: user.notification_preferences.transaction_review,
        });
      }
    }
  }, [user, profileForm, notificationForm]);

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const response = await api.put<ApiResponse<User>>('/users/me', data);
      if (response.data.data) {
        setUser(response.data.data);
      }
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async (data: NotificationFormData) => {
    setIsLoading(true);
    try {
      await api.put('/auth/notification-settings', data);
      toast.success('Notification settings updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.current_password,
        newPassword: data.new_password,
      });
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const filingStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married_joint', label: 'Married Filing Jointly' },
    { value: 'married_separate', label: 'Married Filing Separately' },
    { value: 'head_of_household', label: 'Head of Household' },
  ];

  const taxRateOptions = [
    { value: '10', label: '10%' },
    { value: '12', label: '12%' },
    { value: '22', label: '22%' },
    { value: '24', label: '24%' },
    { value: '32', label: '32%' },
    { value: '35', label: '35%' },
    { value: '37', label: '37%' },
  ];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                  <Input
                    label="Full Name"
                    {...profileForm.register('full_name', { required: 'Name is required' })}
                    error={profileForm.formState.errors.full_name?.message}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Tax Filing Status"
                      options={filingStatusOptions}
                      {...profileForm.register('tax_filing_status')}
                    />
                    <Select
                      label="Marginal Tax Rate"
                      options={taxRateOptions}
                      {...profileForm.register('marginal_tax_rate', { valueAsNumber: true })}
                    />
                  </div>

                  <Input
                    label="Annual W-2 Withholding"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    helperText="Enter total tax withheld from W-2 income to improve estimates"
                    {...profileForm.register('w2_withholding_annual', { valueAsNumber: true })}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" isLoading={isLoading}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={notificationForm.handleSubmit(handleNotificationUpdate)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Delivery Channels</h4>
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Push Notifications</p>
                        <p className="text-sm text-gray-500">
                          Receive notifications on your device
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...notificationForm.register('push_enabled')}
                        className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">
                          Receive notifications via email
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...notificationForm.register('email_enabled')}
                        className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>
                  </div>

                  <div className="space-y-4 pt-6 border-t">
                    <h4 className="font-medium text-gray-900">Notification Types</h4>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Income Threshold Alerts</p>
                        <p className="text-sm text-gray-500">
                          Alert when approaching $5,000 IRS threshold
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...notificationForm.register('threshold_alerts')}
                        className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Tax Deadline Reminders</p>
                        <p className="text-sm text-gray-500">
                          Reminders before quarterly tax deadlines
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...notificationForm.register('deadline_reminders')}
                        className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Transaction Review</p>
                        <p className="text-sm text-gray-500">
                          Notify when transactions need categorization
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...notificationForm.register('transaction_review')}
                        className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Weekly Digest</p>
                        <p className="text-sm text-gray-500">
                          Weekly summary of income and expenses
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...notificationForm.register('weekly_digest')}
                        className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" isLoading={isLoading}>
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                    className="space-y-4"
                  >
                    <Input
                      label="Current Password"
                      type="password"
                      {...passwordForm.register('current_password', {
                        required: 'Current password is required',
                      })}
                      error={passwordForm.formState.errors.current_password?.message}
                    />

                    <Input
                      label="New Password"
                      type="password"
                      {...passwordForm.register('new_password', {
                        required: 'New password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                      })}
                      error={passwordForm.formState.errors.new_password?.message}
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      {...passwordForm.register('confirm_password', {
                        required: 'Please confirm your password',
                      })}
                      error={passwordForm.formState.errors.confirm_password?.message}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" isLoading={isLoading}>
                        Update Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Created</p>
                      <p className="font-medium text-gray-900">
                        {user?.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
