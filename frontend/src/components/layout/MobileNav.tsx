'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                {/* Close button */}
                <div className="flex h-16 shrink-0 items-center justify-between">
                  <Logo size="sm" />
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col">
                  <ul className="flex flex-1 flex-col gap-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              'group flex items-center gap-x-3 rounded-lg p-3 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <item.icon
                              className={cn(
                                'h-5 w-5 shrink-0',
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
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
