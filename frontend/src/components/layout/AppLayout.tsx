'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { PageLoader } from '../ui/Spinner';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const { fetchUnreadCount } = useNotificationStore();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      setIsInitialized(true);
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Sidebar />
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="lg:pl-64">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
