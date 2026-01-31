import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import LenisProvider from '@/components/LenisProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'TaxGig - Smart Tax Tracking for Gig Workers',
    template: '%s | TaxGig',
  },
  description: 'Stop overpaying on taxes. Automatically track income from Uber, DoorDash, Upwork, and more. Get smart expense categorization, mileage tracking, and quarterly tax estimates.',
  keywords: ['tax tracker', 'side hustle', 'gig economy', 'freelancer taxes', 'quarterly taxes', 'expense tracking', 'mileage tracker', 'self-employed', 'uber taxes', 'doordash taxes'],
  authors: [{ name: 'TaxGig' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'TaxGig',
    title: 'TaxGig - Smart Tax Tracking for Gig Workers',
    description: 'Stop overpaying on taxes. Automatically track income from Uber, DoorDash, Upwork, and more.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxGig',
    description: 'Smart tax tracking for gig workers, freelancers, and side hustlers.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
