'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import ScrollReveal from '@/components/ScrollReveal';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <PageLoader />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <PublicNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-8 transform transition-all duration-500 hover:scale-105">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Trusted by 10,000+ gig workers
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6 transition-all duration-500"
            >
              Stop Overpaying on{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">Side Hustle Taxes</span>
            </h1>
            <p
              className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed"
            >
              Automatically track income from Uber, DoorDash, Upwork, and more. Get smart expense categorization,
              mileage tracking, and quarterly tax estimates.
            </p>
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-4 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
                  Start Tracking for Free
                </Button>
              </Link>
              <Link href="/features" className="text-gray-600 hover:text-gray-900 font-medium flex items-center group transition-colors duration-200">
                Learn More
                <svg className="w-5 h-5 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 max-w-5xl mx-auto animate-fade-in-up delay-300">
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-500 hover:shadow-3xl"
            >
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                    <div className="text-sm text-gray-500 mb-1">YTD Income</div>
                    <div className="text-2xl font-bold text-gray-900">$24,850.00</div>
                    <div className="text-sm text-green-600 mt-1">+12% from last month</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                    <div className="text-sm text-gray-500 mb-1">Tax Deductions</div>
                    <div className="text-2xl font-bold text-gray-900">$6,420.50</div>
                    <div className="text-sm text-blue-600 mt-1">Saving you ~$1,605</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                    <div className="text-sm text-gray-500 mb-1">Q1 Estimate Due</div>
                    <div className="text-2xl font-bold text-gray-900">$1,245.00</div>
                    <div className="text-sm text-amber-600 mt-1">Due Apr 15, 2026</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">Recent Transactions</span>
                    <span className="text-sm text-blue-600 cursor-pointer hover:text-blue-700 transition-colors">View All</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Uber Payment</div>
                          <div className="text-sm text-gray-500">Jan 26, 2026</div>
                        </div>
                      </div>
                      <span className="text-green-600 font-semibold">+$203.15</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Shell Gas Station</div>
                          <div className="text-sm text-gray-500">Jan 22, 2026 - Deductible</div>
                        </div>
                      </div>
                      <span className="text-red-600 font-semibold">-$55.20</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-white border-y border-gray-200">
        <ScrollReveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 mb-8 text-lg">Works with all your income sources</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {['Uber', 'DoorDash', 'Upwork', 'Etsy', 'Lyft', 'Fiverr'].map((brand) => (
              <span
                key={brand}
                className="text-xl font-bold text-gray-400 hover:text-gray-600 transition-colors duration-300 cursor-default"
              >
                {brand}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Maximize Deductions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built specifically for gig workers, freelancers, and side hustlers.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                color: 'blue',
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                title: 'Auto-Sync Bank Accounts',
                description: 'Connect securely via Plaid. Income and expenses imported automatically.'
              },
              {
                color: 'green',
                icon: (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
                title: 'Smart Categorization',
                description: 'AI identifies business expenses. Never miss a deduction.'
              },
              {
                color: 'amber',
                icon: (
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Quarterly Tax Estimates',
                description: 'Real-time calculations with deadline reminders.'
              },
              {
                color: 'purple',
                icon: (
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                title: 'Mileage Tracking',
                description: 'Log business miles with current IRS rates.'
              },
              {
                color: 'cyan',
                icon: (
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Tax-Ready Reports',
                description: 'Schedule C reports and expense breakdowns ready to export.'
              },
              {
                color: 'rose',
                icon: (
                  <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                ),
                title: 'Invoice Clients',
                description: 'Send professional invoices and track payments.'
              }
            ].map((feature, index) => (
              <ScrollReveal key={index} delay={(index % 3) * 100}>
                <div
                  className="p-6 rounded-xl border hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full"
                  style={{
                    backgroundColor: feature.color === 'blue' ? '#eff6ff' : feature.color === 'green' ? '#f0fdf4' : feature.color === 'amber' ? '#fffbeb' : feature.color === 'purple' ? '#faf5ff' : feature.color === 'cyan' ? '#ecfeff' : '#fff1f2',
                    borderColor: feature.color === 'blue' ? '#dbeafe' : feature.color === 'green' ? '#dcfce7' : feature.color === 'amber' ? '#fef3c7' : feature.color === 'purple' ? '#f3e8ff' : feature.color === 'cyan' ? '#cffafe' : '#fce7f3',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: feature.color === 'blue' ? '#dbeafe' : feature.color === 'green' ? '#dcfce7' : feature.color === 'amber' ? '#fef3c7' : feature.color === 'purple' ? '#f3e8ff' : feature.color === 'cyan' ? '#cffafe' : '#fce7f3' }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/features">
              <Button variant="secondary" size="lg" className="group">
                View All Features
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, title: 'Create Your Account', description: 'Sign up free. No credit card required.' },
              { step: 2, title: 'Connect Your Banks', description: 'Securely link accounts. Auto-import transactions.' },
              { step: 3, title: 'Track & Save', description: 'Watch deductions grow. Never overpay the IRS.' }
            ].map((item, index) => (
              <ScrollReveal key={item.step} delay={index * 150}>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white shadow-lg shadow-blue-500/30 transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/40">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700 overflow-hidden">
        <ScrollReveal className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Keep More of Your Money?
          </h2>
          <p className="text-lg text-blue-100 mb-10">
            Join thousands of gig workers maximizing their deductions. Start free today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login" className="text-white hover:text-blue-100 font-medium transition-colors duration-200">
              Already have an account? Sign in
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
