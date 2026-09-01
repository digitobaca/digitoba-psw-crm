import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { formatDate } from '@/lib/utils';
import { BLOG_POSTS } from '@/data/blogPosts';

export default function BlogPage() {
  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Blog &amp; News</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Guides, checklists, and updates on studying, working, and immigrating to Canada.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post) => (
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
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
                  <p className="mt-3 text-xs text-gray-500">
                    {formatDate(post.date)} &middot; {post.readMinutes} min read
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
