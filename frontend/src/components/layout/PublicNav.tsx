'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Logo } from '@/components/Logo';
import Button from '@/components/ui/Button';

interface PublicNavProps {
  activePage?: 'features' | 'pricing' | 'blog' | null;
}

export default function PublicNav({ activePage }: PublicNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Determine active page from pathname if not explicitly provided
  const currentPage = activePage ||
    (pathname === '/features' ? 'features' :
     pathname === '/pricing' ? 'pricing' :
     pathname.startsWith('/blog') ? 'blog' : null);

  const navLinks = [
    { name: 'Features', href: '/features', id: 'features' },
    { name: 'Pricing', href: '/pricing', id: 'pricing' },
    { name: 'Blog', href: '/blog', id: 'blog' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`font-medium transition-colors duration-200 ${
                  currentPage === link.id
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
              Sign In
            </Link>
            <Link href="/register">
              <Button size="md">Get Started Free</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
              Sign In
            </Link>
            <button
              type="button"
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`block px-3 py-2 rounded-lg font-medium ${
                  currentPage === link.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-200">
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
