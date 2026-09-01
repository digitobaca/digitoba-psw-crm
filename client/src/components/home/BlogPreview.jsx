import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { formatDate } from '@/lib/utils';
import { BLOG_POSTS } from '@/data/blogPosts';

export default function BlogPreview() {
  const posts = BLOG_POSTS.slice(0, 3);

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-primary font-semibold text-sm uppercase tracking-wide">Resources</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">Latest from the Blog</h2>
          <p className="mt-4 text-gray-600">Guides, checklists, and updates to help you navigate your Canadian journey.</p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <div className="h-40 rounded-t-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                  <span className="text-primary/50 font-bold text-4xl">CD</span>
                </div>
                <CardContent className="pt-5">
                  <Badge variant="secondary">{post.category}</Badge>
                  <h3 className="mt-3 font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                  <p className="mt-3 text-xs text-gray-500">
                    {formatDate(post.date)} &middot; {post.readMinutes} min read
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <p className="text-center mt-10">
          <Link to="/blog" className="text-primary font-medium hover:underline">
            View all articles →
          </Link>
        </p>
      </div>
    </section>
  );
}
