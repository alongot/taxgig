import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPost, blogPosts, categories, getRecentPosts } from '@/lib/blog-data';
import { Logo } from '@/components/Logo';
import Button from '@/components/ui/Button';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | TaxGig`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

const categoryColors: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  purple: 'bg-purple-100 text-purple-800',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-800',
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRecentPosts(3).filter(p => p.slug !== slug);
  const category = categories.find(c => c.name === post.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <PublicNav activePage="blog" />

      {/* Article */}
      <article className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
              <li>/</li>
              <li><Link href="/blog" className="hover:text-primary-600">Blog</Link></li>
              <li>/</li>
              <li className="text-gray-900 truncate max-w-xs">{post.title}</li>
            </ol>
          </nav>

          {/* Post Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                categoryColors[category?.color || 'blue']
              }`}>
                {post.category}
              </span>
              <span className="text-gray-500">{post.readTime}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              {post.description}
            </p>
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-bold text-lg">ST</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{post.author}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </header>

          {/* Post Content */}
          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-600 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
            <div dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
          </div>

          {/* Keywords */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Related Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* CTA Box */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-3">
              Ready to Simplify Your Taxes?
            </h3>
            <p className="text-blue-100 mb-6">
              Join thousands of gig workers who automatically track their income and deductions with TaxGig.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300">
                Start Tracking Free
              </Button>
            </Link>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">More Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="group bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      categoryColors[categories.find(c => c.name === relatedPost.category)?.color || 'blue']
                    }`}>
                      {relatedPost.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {relatedPost.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {relatedPost.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}

// Simple markdown to HTML converter
function formatContent(content: string): string {
  return content
    // Convert headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Convert bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Convert unordered lists
    .replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>')
    // Convert ordered lists
    .replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>')
    // Wrap consecutive list items
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Convert horizontal rules
    .replace(/^---$/gim, '<hr />')
    // Convert tables (basic)
    .replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map((cell: string) => cell.trim());
      const isHeader = cells.some((cell: string) => cell.includes('---'));
      if (isHeader) return '';
      return `<tr>${cells.map((cell: string) => `<td class="border border-gray-200 px-4 py-2">${cell}</td>`).join('')}</tr>`;
    })
    // Wrap tables
    .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table class="w-full border-collapse mb-6">${match}</table>`)
    // Convert code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Convert inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Convert paragraphs (text blocks separated by double newlines)
    .replace(/\n\n(?!<)/g, '</p><p>')
    // Wrap in paragraphs
    .replace(/^(?!<)(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return `<p>${match}</p>`;
    })
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    // Clean up paragraph tags around block elements
    .replace(/<p>(<h[1-6]|<ul|<ol|<table|<hr|<pre)/g, '$1')
    .replace(/(<\/h[1-6]>|<\/ul>|<\/ol>|<\/table>|<hr \/>|<\/pre>)<\/p>/g, '$1');
}
