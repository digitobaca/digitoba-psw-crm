import { useParams, Link, Navigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge.jsx';
import { formatDate } from '@/lib/utils';
import { BLOG_POSTS } from '@/data/blogPosts';
import CTASection from '@/components/home/CTASection.jsx';
import { ArrowLeft } from 'lucide-react';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <>
      <article className="section">
        <div className="container max-w-2xl">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <Badge variant="secondary" className="mt-6">{post.category}</Badge>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-gray-900">{post.title}</h1>
          <p className="mt-3 text-sm text-gray-500">
            {formatDate(post.date)} &middot; {post.readMinutes} min read
          </p>

          <div className="mt-8 h-56 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
            <span className="text-primary/50 font-bold text-5xl">CD</span>
          </div>

          <div className="mt-8 prose prose-gray max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
            {post.content}
          </div>
        </div>
      </article>

      <CTASection />
    </>
  );
}
