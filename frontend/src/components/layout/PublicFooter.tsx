'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function PublicFooter() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <Logo size="md" textColor="text-white" />
            <p className="mt-4 text-sm text-gray-400 max-w-md">
              The smart way to track your side hustle finances. Maximize deductions, stay organized, and never overpay on taxes again.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="hover:text-white transition-colors duration-200">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors duration-200">Pricing</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors duration-200">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-white transition-colors duration-200">Get Started</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors duration-200">Sign In</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} TaxGig. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
