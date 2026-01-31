import { create } from 'zustand';
import api from '@/lib/api';
import type { Notification, PaginatedResponse } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },

  fetchNotifications: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<PaginatedResponse<Notification>>('/notifications', {
        params: { page, limit },
      });
      const data = response.data?.data;
      set({
        notifications: Array.isArray(data) ? data : [],
        pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
      set({ error: message, isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get<{ success: boolean; data: { count: number } }>(
        '/notifications/unread-count'
      );
      set({ unreadCount: response.data?.data?.count || 0 });
    } catch (error) {
      // Silently fail for badge count
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.notification_id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to mark notification as read';
      set({ error: message });
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/mark-all-read');
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
      set({ error: message });
    }
  },

  dismissNotification: async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.notification_id !== id),
        unreadCount: state.notifications.find((n) => n.notification_id === id && !n.is_read)
          ? state.unreadCount - 1
          : state.unreadCount,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to dismiss notification';
      set({ error: message });
    }
  },
}));
