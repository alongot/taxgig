'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BanknotesIcon,
  CreditCardIcon,
  CalculatorIcon,
  DocumentTextIcon,
  BellIcon,
  Cog6ToothIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';
import { Logo } from '@/components/Logo';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Transactions', href: '/transactions', icon: CreditCardIcon },
  { name: 'Expenses', href: '/expenses', icon: BanknotesIcon },
  { name: 'Tax', href: '/tax', icon: CalculatorIcon },
  { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  { name: 'Accounts', href: '/accounts', icon: BuildingLibraryIcon },
  { name: 'Notifications', href: '/notifications', icon: BellIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 hidden lg:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <Link href="/dashboard">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
                {item.name === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-danger-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            TaxGig v0.1
          </p>
        </div>
      </div>
    </aside>
  );
}
