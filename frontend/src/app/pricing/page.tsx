'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with side hustle tracking.',
    features: [
      { name: 'Track up to 50 transactions/month', included: true },
      { name: 'Connect 1 bank account', included: true },
      { name: 'Basic expense categories', included: true },
      { name: 'Manual mileage logging', included: true },
      { name: 'Basic quarterly estimates', included: true },
      { name: 'Smart categorization (AI)', included: false },
      { name: 'Unlimited transactions', included: false },
      { name: 'Schedule C reports', included: false },
      { name: 'Invoice generation', included: false },
      { name: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    ctaVariant: 'secondary' as const,
    popular: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    description: 'Everything you need to maximize your tax deductions.',
    features: [
      { name: 'Unlimited transactions', included: true },
      { name: 'Connect up to 5 bank accounts', included: true },
      { name: 'Smart categorization (AI)', included: true },
      { name: 'Automatic mileage tracking', included: true },
      { name: 'Quarterly tax estimates', included: true },
      { name: 'Schedule C tax reports', included: true },
      { name: 'Receipt scanning & storage', included: true },
      { name: 'Invoice generation (10/month)', included: true },
      { name: 'Email support', included: true },
      { name: 'White-label invoices', included: false },
    ],
    cta: 'Start 14-Day Free Trial',
    ctaVariant: 'primary' as const,
    popular: true,
  },
  {
    name: 'Business',
    price: '$29',
    period: 'per month',
    description: 'For serious freelancers and small business owners.',
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Unlimited bank accounts', included: true },
      { name: 'Unlimited invoices', included: true },
      { name: 'White-label invoices', included: true },
      { name: 'Multi-business tracking', included: true },
      { name: 'Advanced tax reports', included: true },
      { name: 'Profit & loss statements', included: true },
      { name: 'Priority phone support', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'API access', included: true },
    ],
    cta: 'Start 14-Day Free Trial',
    ctaVariant: 'primary' as const,
    popular: false,
  },
];

const comparisonFeatures = [
  { name: 'Monthly transactions', free: '50', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'Connected bank accounts', free: '1', pro: '5', business: 'Unlimited' },
  { name: 'AI expense categorization', free: false, pro: true, business: true },
  { name: 'Mileage tracking', free: 'Manual', pro: 'Automatic', business: 'Automatic' },
  { name: 'Quarterly tax estimates', free: 'Basic', pro: 'Advanced', business: 'Advanced' },
  { name: 'Schedule C reports', free: false, pro: true, business: true },
  { name: 'Receipt scanning', free: false, pro: true, business: true },
  { name: 'Invoice generation', free: false, pro: '10/month', business: 'Unlimited' },
  { name: 'White-label invoices', free: false, pro: false, business: true },
  { name: 'Multi-business support', free: false, pro: false, business: true },
  { name: 'Profit & loss statements', free: false, pro: false, business: true },
  { name: 'Support', free: 'Community', pro: 'Email', business: 'Priority phone' },
  { name: 'API access', free: false, pro: false, business: true },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <PublicNav activePage="pricing" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your side hustle. Start free, upgrade when you are ready.
          </p>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 transition-all duration-300 hover:shadow-xl ${
                  tier.popular ? 'border-blue-500 scale-105' : 'border-gray-200'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-500 ml-2">/{tier.period}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.included ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/register">
                  <Button
                    variant={tier.ctaVariant}
                    className={`w-full ${tier.popular ? 'shadow-lg shadow-blue-500/25' : ''}`}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Compare Plans</h2>
            <p className="text-gray-600">A detailed look at what each plan includes.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-blue-600 bg-blue-50 rounded-t-lg">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Business</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">{feature.name}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XMarkIcon className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-600">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-blue-50">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XMarkIcon className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 font-medium">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.business === 'boolean' ? (
                        feature.business ? (
                          <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XMarkIcon className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-600">{feature.business}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                question: 'Can I change plans at any time?',
                answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you will be prorated for the remaining days. When downgrading, your new rate takes effect at the next billing cycle.'
              },
              {
                question: 'Is there a free trial for paid plans?',
                answer: 'Yes, both Pro and Business plans come with a 14-day free trial. No credit card required to start. You can cancel anytime during the trial.'
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and PayPal. Enterprise customers can also pay by invoice.'
              },
              {
                question: 'Is my financial data secure?',
                answer: 'Absolutely. We use bank-level 256-bit encryption and connect to your accounts through Plaid, the same provider trusted by Venmo, Robinhood, and other major financial apps. We never store your bank login credentials.'
              },
              {
                question: 'Can I export my data?',
                answer: 'Yes, you can export all your data at any time in CSV or PDF format. Your data belongs to you, and we make it easy to take it with you.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start Tracking Your Side Hustle Today
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of gig workers saving money on their taxes. No credit card required.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
