import Link from 'next/link';
import { Metadata } from 'next';
import { blogPosts, categories, getFeaturedPosts, getRecentPosts } from '@/lib/blog-data';
import { Logo } from '@/components/Logo';
import Button from '@/components/ui/Button';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';

export const metadata: Metadata = {
  title: 'Blog - TaxGig',
  description: 'Tax tips, deduction guides, and financial advice for gig workers, freelancers, and side hustlers.',
  keywords: ['gig worker taxes', 'freelance tax tips', 'side hustle deductions', 'self employment tax'],
};

const categoryColors: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  purple: 'bg-purple-100 text-purple-800',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-800',
};

export default function BlogPage() {
  const featuredPosts = getFeaturedPosts();
  const recentPosts = getRecentPosts(10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <PublicNav activePage="blog" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tax Tips for Gig Workers
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Expert guides on deductions, quarterly taxes, and income tracking for freelancers and side hustlers.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`#${category.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${categoryColors[category.color]}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        categoryColors[categories.find(c => c.name === post.category)?.color || 'blue']
                      }`}>
                        {post.category}
                      </span>
                      <span className="text-gray-500 text-sm">{post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {post.description}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>{post.author}</span>
                      <span className="mx-2">·</span>
                      <span>{new Date(post.publishedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">All Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    categoryColors[categories.find(c => c.name === post.category)?.color || 'blue']
                  }`}>
                    {post.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{post.readTime}</span>
                  <span>{new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Stop Guessing What You Owe
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Automatically track income, expenses, and calculate quarterly taxes across all your gig platforms.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
              Start Tracking Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
