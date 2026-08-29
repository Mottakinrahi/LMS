import Link from 'next/link';
import { STRAPI_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getBlogPost(id: string) {
  try {
    const res = await fetch(`${STRAPI_URL}/api/blog-posts/${id}?populate=author`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getBlogPost(id);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Article Not Found</h1>
          <Link href="/blog" className="text-indigo-400 font-semibold">&larr; Back to Blog</Link>
        </div>
      </div>
    );
  }

  const attrs = post.attributes || post;
  const author = attrs.author?.data?.attributes || attrs.author;
  const dateStr = attrs.publishedAt
    ? new Date(attrs.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Draft';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/blog" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
          &larr; Back to Blog
        </Link>

        <article className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 space-y-8 shadow-2xl">
          {attrs.coverImageUrl && (
            <img
              src={attrs.coverImageUrl}
              alt={attrs.title}
              className="w-full h-80 object-cover rounded-xl border border-slate-800"
            />
          )}

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold text-white leading-tight">{attrs.title}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-400 border-b border-slate-800 pb-4">
              <span>Written by <strong className="text-indigo-400">{author?.username || 'Editorial Team'}</strong></span>
              <span>•</span>
              <span>{dateStr}</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-base whitespace-pre-line">
            {attrs.body}
          </div>
        </article>
      </div>
    </div>
  );
}
