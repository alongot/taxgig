'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import {
  BuildingLibraryIcon,
  SparklesIcon,
  MapPinIcon,
  CalculatorIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BellAlertIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const mainFeatures = [
  {
    icon: BuildingLibraryIcon,
    title: 'Bank Account Syncing via Plaid',
    description: 'Securely connect your bank accounts, credit cards, and payment platforms. Transactions are automatically imported daily, categorized, and ready for review.',
    details: [
      'Connect checking, savings, and credit card accounts',
      'Automatic daily transaction sync',
      'Supports 10,000+ financial institutions',
      'Bank-level 256-bit encryption',
      'Read-only access - we never move your money',
    ],
    color: 'blue',
  },
  {
    icon: SparklesIcon,
    title: 'Smart Expense Categorization',
    description: 'Our AI learns your spending patterns and automatically categorizes business expenses. Never miss a tax deduction again.',
    details: [
      'AI-powered transaction categorization',
      'Learns from your corrections over time',
      'IRS Schedule C category mapping',
      'Custom category creation',
      'Bulk categorization tools',
    ],
    color: 'purple',
  },
  {
    icon: MapPinIcon,
    title: 'Mileage Tracking',
    description: 'Log your business miles with the current IRS mileage rate. Manual entry or automatic GPS tracking on mobile.',
    details: [
      'Current IRS mileage rate applied automatically',
      'GPS-based automatic trip detection (mobile)',
      'Manual trip logging with route history',
      'Separate tracking for different vehicles',
      'Mileage reports for tax filing',
    ],
    color: 'green',
  },
  {
    icon: CalculatorIcon,
    title: 'Quarterly Tax Estimates',
    description: 'Real-time estimated tax calculations based on your income and deductions. Get reminders before quarterly deadlines.',
    details: [
      'Real-time tax liability calculations',
      'Federal and state tax estimates',
      'Self-employment tax included',
      'Quarterly payment reminders',
      'Safe harbor calculations',
    ],
    color: 'amber',
  },
  {
    icon: DocumentChartBarIcon,
    title: 'Tax Reports (Schedule C)',
    description: 'Generate IRS-ready Schedule C reports with all your income and deductions properly categorized and totaled.',
    details: [
      'Pre-filled Schedule C data',
      'Expense breakdown by category',
      'Year-over-year comparison',
      'Export to PDF or CSV',
      'CPA-friendly format',
    ],
    color: 'cyan',
  },
  {
    icon: DocumentTextIcon,
    title: 'Invoice Generation',
    description: 'Create professional invoices and send them directly to clients. Track payment status and outstanding balances.',
    details: [
      'Professional invoice templates',
      'Custom branding options',
      'Email invoices directly',
      'Payment tracking and reminders',
      'Late payment notifications',
    ],
    color: 'rose',
  },
];

const additionalFeatures = [
  {
    icon: ShieldCheckIcon,
    title: 'Bank-Level Security',
    description: 'Your data is protected with 256-bit encryption. We use Plaid for secure bank connections.',
  },
  {
    icon: BellAlertIcon,
    title: 'Smart Notifications',
    description: 'Get alerts for tax deadlines, large transactions, and categorization needs.',
  },
  {
    icon: ChartBarIcon,
    title: 'Income Analytics',
    description: 'Visualize your income trends across platforms, months, and categories.',
  },
  {
    icon: CloudArrowUpIcon,
    title: 'Receipt Storage',
    description: 'Snap photos of receipts and attach them to transactions for audit-proof records.',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Mobile Ready',
    description: 'Access your dashboard from any device. Track expenses on the go.',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Multi-Platform Income',
    description: 'Track income from Uber, DoorDash, Upwork, Etsy, and all your side hustles.',
  },
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; iconBg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-100' },
    purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-100' },
    green: { bg: 'bg-green-50', iconBg: 'bg-green-100', text: 'text-green-600', border: 'border-green-100' },
    amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-100' },
    cyan: { bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-100' },
    rose: { bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-100' },
  };
  return colors[color] || colors.blue;
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <PublicNav activePage="features" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Everything You Need to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800"> Maximize Deductions</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Built specifically for gig workers, freelancers, and side hustlers. Track income, categorize expenses,
            and stay on top of your taxes with powerful automation.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-20">
            {mainFeatures.map((feature, index) => {
              const colors = getColorClasses(feature.color);
              const isEven = index % 2 === 0;
              const IconComponent = feature.icon;

              return (
                <div
                  key={index}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}
                >
                  <div className="flex-1">
                    <div className={`inline-flex items-center justify-center w-14 h-14 ${colors.iconBg} rounded-xl mb-6`}>
                      <IconComponent className={`w-7 h-7 ${colors.text}`} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h2>
                    <p className="text-lg text-gray-600 mb-6">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start">
                          <svg className={`w-5 h-5 ${colors.text} mr-3 mt-0.5 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 w-full max-w-lg">
                    <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-8 shadow-lg`}>
                      <div className="aspect-video bg-white rounded-xl shadow-inner flex items-center justify-center">
                        <IconComponent className={`w-24 h-24 ${colors.text} opacity-50`} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">And So Much More</h2>
            <p className="text-lg text-gray-600">
              Additional features to make tax tracking effortless.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Partners */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Works With Your Favorite Platforms</h2>
            <p className="text-lg text-gray-600">
              Connect all your income sources in one place.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {['Uber', 'Lyft', 'DoorDash', 'Instacart', 'Upwork', 'Fiverr', 'Etsy', 'Shopify', 'PayPal', 'Venmo', 'Stripe', 'Square'].map((platform) => (
              <span
                key={platform}
                className="text-xl font-bold text-gray-400 hover:text-gray-600 transition-colors duration-300"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Simplify Your Side Hustle Taxes?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Start tracking your income and expenses in minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started Free
              </Button>
            </Link>
            <Link href="/pricing" className="text-white hover:text-blue-100 font-medium transition-colors duration-200">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
