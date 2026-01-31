'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import type { NotificationType } from '@/types';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CreditCardIcon,
  LinkIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'threshold_alert':
      return <ExclamationTriangleIcon className="w-5 h-5 text-warning-600" />;
    case 'deadline_reminder':
      return <CalendarIcon className="w-5 h-5 text-danger-600" />;
    case 'review_needed':
      return <CreditCardIcon className="w-5 h-5 text-primary-600" />;
    case 'connection_error':
      return <LinkIcon className="w-5 h-5 text-danger-600" />;
    case 'weekly_digest':
      return <InformationCircleIcon className="w-5 h-5 text-primary-600" />;
    case 'system_announcement':
      return <InformationCircleIcon className="w-5 h-5 text-primary-600" />;
    case 'tax_tip':
      return <InformationCircleIcon className="w-5 h-5 text-success-600" />;
    default:
      return <BellIcon className="w-5 h-5 text-gray-600" />;
  }
};

const getNotificationBadge = (type: NotificationType) => {
  switch (type) {
    case 'threshold_alert':
      return <Badge variant="warning">Alert</Badge>;
    case 'deadline_reminder':
      return <Badge variant="danger">Deadline</Badge>;
    case 'review_needed':
      return <Badge variant="info">Review</Badge>;
    case 'connection_error':
      return <Badge variant="danger">Error</Badge>;
    case 'weekly_digest':
      return <Badge>Digest</Badge>;
    case 'system_announcement':
      return <Badge variant="info">Announcement</Badge>;
    case 'tax_tip':
      return <Badge variant="success">Tip</Badge>;
    default:
      return null;
  }
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDismiss = async (id: string) => {
    await dismissNotification(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handlePageChange = (newPage: number) => {
    fetchNotifications(newPage, pagination.limit);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAllAsRead}>
            <CheckIcon className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {(!notifications || notifications.length === 0) ? (
            <EmptyState
              icon={<BellIcon className="w-12 h-12" />}
              title="No notifications"
              description="You are all caught up! We will notify you when there is something important."
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {(notifications || []).map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-4 transition-colors ${
                    !notification.is_read ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        !notification.is_read ? 'bg-white' : 'bg-gray-100'
                      }`}
                    >
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        {getNotificationBadge(notification.notification_type)}
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(notification.created_at, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {notification.action_url && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            handleMarkAsRead(notification.notification_id);
                            window.location.href = notification.action_url!;
                          }}
                        >
                          View
                        </Button>
                      )}
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.notification_id)}
                          className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                          title="Mark as read"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(notification.notification_id)}
                        className="p-2 text-gray-400 hover:text-danger-500 transition-colors"
                        title="Dismiss"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
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
              onClick={() => handlePageChange((pagination?.page || 1) - 1)}
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
              onClick={() => handlePageChange((pagination?.page || 1) + 1)}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Notification Settings Link */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Notification Settings</h3>
              <p className="text-sm text-gray-500">
                Manage how and when you receive notifications
              </p>
            </div>
            <Button variant="secondary" onClick={() => window.location.href = '/settings'}>
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
